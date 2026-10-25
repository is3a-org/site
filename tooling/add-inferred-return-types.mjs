import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  findPrecedingToken,
  isArrowFunction,
  isExpressionStatement,
  isFunctionDeclaration,
  isFunctionExpression,
  isGetAccessorDeclaration,
  isMethodDeclaration,
  isStringLiteral,
  SyntaxKind,
} from "typescript/unstable/ast";
import { API, NodeBuilderFlags } from "typescript/unstable/sync";

// Preview with `node tooling/add-inferred-return-types.mjs`; add --write to apply.
// Requires the repository's installed TypeScript 7 API and generated project types.
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const writeAnnotations = process.argv.includes("--write");
const lintResult = JSON.parse(
  execFileSync("pnpm", ["lint", "--format=json"], {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  }),
);
const returnTypeRules = new Set([
  "typescript(explicit-function-return-type)",
  "typescript(explicit-module-boundary-types)",
]);
const diagnosticsByFile = new Map();
for (const diagnostic of lintResult.diagnostics) {
  if (!returnTypeRules.has(diagnostic.code)) {
    continue;
  }
  const filename = path.resolve(projectRoot, diagnostic.filename);
  if (!/\.tsx?$/.test(filename)) {
    continue;
  }
  const diagnostics = diagnosticsByFile.get(filename) ?? [];
  diagnostics.push(diagnostic);
  diagnosticsByFile.set(filename, diagnostics);
}

const api = new API({ cwd: projectRoot });
const proposals = [];
const skipped = [];
const plannedFiles = [];

function getReturnTypeSkipReason(typeText, predicate) {
  if (!typeText) {
    return "No inferred type";
  }
  if (predicate) {
    return "Needs a type predicate contract";
  }
  if (/\b(?:any|unknown)\b/.test(typeText)) {
    return "Contains any or unknown";
  }
  if (typeText.includes("{")) {
    return "Needs a named object contract";
  }
  if (typeText.length > 240) {
    return "Inferred type is too large";
  }
  return "";
}

try {
  const snapshot = api.updateSnapshot({
    openProjects: [
      "apps/web/tsconfig.cloudflare.json",
      "apps/web/tsconfig.node.json",
      "packages/design-system/tsconfig.json",
      "packages/one-time-password-fragment/tsconfig.json",
    ].map((filename) => path.resolve(projectRoot, filename)),
    openFiles: [...diagnosticsByFile.keys()],
  });
  try {
    for (const [filename, diagnostics] of diagnosticsByFile) {
      // Prefer the owning project to another project's imported copy of this file.
      const project = snapshot.getProjects().find((entry) => entry.rootFiles.includes(filename));
      const source = project?.program.getSourceFile(filename);
      if (!source) {
        throw new Error(`Return type project not found: ${filename}`);
      }
      const originalText = readFileSync(filename, "utf8");
      if (originalText !== source.text) {
        throw new Error(`Return type source snapshot is stale: ${filename}`);
      }
      const functions = [];
      function collectFunctions(node) {
        if (
          (isFunctionDeclaration(node) ||
            isFunctionExpression(node) ||
            isArrowFunction(node) ||
            isMethodDeclaration(node) ||
            isGetAccessorDeclaration(node)) &&
          node.body &&
          !node.type
        ) {
          functions.push(node);
        }
        node.forEachChild(collectFunctions);
      }
      collectFunctions(source);
      const targetFunctions = new Set();
      for (const diagnostic of diagnostics) {
        const { offset: byteOffset, length: byteLength } = diagnostic.labels[0].span;
        const position = Buffer.from(originalText).subarray(0, byteOffset).toString("utf8").length;
        const end = Buffer.from(originalText)
          .subarray(0, byteOffset + byteLength)
          .toString("utf8").length;
        const target = functions.find(
          (node) => node.getStart(source) <= end && position < node.body.getStart(source),
        );
        if (!target) {
          throw new Error(
            `Return type diagnostic has no matching function: ${filename}:${position}`,
          );
        }
        targetFunctions.add(target);
      }

      const edits = [];
      let needsJsxImport = false;
      for (const node of targetFunctions) {
        const signature = project.checker.getSignatureFromDeclaration(node);
        const returnType = signature && project.checker.getReturnTypeOfSignature(signature);
        const typeText =
          returnType &&
          project.checker.typeToString(returnType, node, NodeBuilderFlags.NoTruncation);
        const location = {
          filename: path.relative(projectRoot, filename),
          line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
          name: node.name?.getText(source),
          type: typeText,
        };
        // Structural results need named contracts, rather than copied anonymous shapes.
        // Weak types and long dependency types also need a deliberate public contract.
        const predicate = signature && project.checker.getTypePredicateOfSignature(signature);
        const reason = getReturnTypeSkipReason(typeText, predicate);
        if (reason) {
          skipped.push({ ...location, type: typeText?.slice(0, 240), reason });
          continue;
        }
        const annotation = typeText.replaceAll('import("react").JSX', "JSX");
        needsJsxImport ||= annotation !== typeText;
        const boundary = isArrowFunction(node) ? node.equalsGreaterThanToken : node.body;
        const previousToken = findPrecedingToken(source, boundary.getStart(source));
        if (previousToken?.kind === SyntaxKind.CloseParenToken) {
          edits.push({ position: previousToken.end, text: `: ${annotation}` });
        } else if (isArrowFunction(node) && node.parameters.length === 1) {
          const parameter = node.parameters[0];
          edits.push(
            { position: parameter.getStart(source), text: "(" },
            { position: parameter.end, text: `): ${annotation}` },
          );
        } else {
          throw new Error(`Return type insertion point not found: ${filename}:${location.line}`);
        }
        proposals.push(location);
      }

      if (needsJsxImport) {
        // Imports must follow directives such as "use client".
        let importPosition = 0;
        for (const statement of source.statements) {
          if (isExpressionStatement(statement) && isStringLiteral(statement.expression)) {
            importPosition = statement.end;
          } else {
            break;
          }
        }
        edits.push({ position: importPosition, text: '\nimport type { JSX } from "react";\n' });
      }
      if (edits.length > 0) {
        let updatedText = originalText;
        for (const edit of edits.toSorted((left, right) => right.position - left.position)) {
          updatedText =
            updatedText.slice(0, edit.position) + edit.text + updatedText.slice(edit.position);
        }
        plannedFiles.push({ filename, originalText, updatedText });
      }
    }
  } finally {
    snapshot.dispose();
  }
} finally {
  api.close();
}

// Finish inference before touching files, and reject edits against changed source.
if (writeAnnotations) {
  for (const file of plannedFiles) {
    if (readFileSync(file.filename, "utf8") !== file.originalText) {
      throw new Error(`Return type source changed during inference: ${file.filename}`);
    }
  }
  for (const file of plannedFiles) {
    writeFileSync(file.filename, file.updatedText);
  }
}

console.log(
  JSON.stringify(
    {
      mode: writeAnnotations ? "write" : "preview",
      annotations: proposals.length,
      proposals,
      skipped,
    },
    undefined,
    2,
  ),
);
