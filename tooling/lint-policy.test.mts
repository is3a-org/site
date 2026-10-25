import test from "node:test";

import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  createScanner,
  getLeadingCommentRanges,
  LanguageVariant,
  SyntaxKind,
  isPropertyAssignment,
  isObjectLiteralExpression,
  isArrayLiteralExpression,
  isStringLiteral,
  isNumericLiteral,
} from "typescript/unstable/ast";
import type { Node } from "typescript/unstable/ast";
import { API } from "typescript/unstable/sync";
import { z } from "zod";

import { parseLintReturnTypeDiagnostics } from "./lint-return-diagnostics.mts";
import type { LintReturnTypeDiagnostic } from "./lint-return-diagnostics.mts";

const projectRoot = path.resolve(import.meta.dirname, "..");
const vitePlusCommand = "pnpm";
const severitySchema = z.union([
  z.enum(["allow", "off", "warn", "warning", "error", "deny"]),
  z.literal(0),
  z.literal(1),
  z.literal(2),
]);
const ruleSettingSchema = z.union([severitySchema, z.tuple([severitySchema]).rest(z.json())]);
const rulesSchema = z.record(z.string(), ruleSettingSchema);
const overrideSchema = z.object({ rules: rulesSchema.optional() });
const lintPolicySchema = z.object({
  rules: rulesSchema,
  overrides: z.array(overrideSchema).optional(),
  ignorePatterns: z.array(z.string()),
});
interface ConfiguredLintPolicy {
  readonly rules: ReadonlyMap<string, string>;
}
function readConfiguredLintPolicy(): ConfiguredLintPolicy {
  const api = new API({ cwd: projectRoot });
  try {
    const filename = path.join(projectRoot, "vite.config.ts");
    const snapshot = api.updateSnapshot({ openFiles: [filename] });
    try {
      const source = snapshot.getDefaultProjectForFile(filename)?.program.getSourceFile(filename);
      assert.ok(
        source !== undefined,
        "Project lint configuration must be parsed by the installed TypeScript API",
      );
      const rules = new Map<string, string>();
      function collectRuleSettings(node: Node): void {
        if (
          isPropertyAssignment(node) &&
          node.name.getText(source) === "rules" &&
          isObjectLiteralExpression(node.initializer)
        ) {
          for (const property of node.initializer.properties) {
            assert.ok(
              isPropertyAssignment(property),
              "Lint policy rule settings must remain explicit properties",
            );
            const setting = isArrayLiteralExpression(property.initializer)
              ? property.initializer.elements.at(0)
              : property.initializer;
            assert.ok(
              setting !== undefined && (isStringLiteral(setting) || isNumericLiteral(setting)),
              "Lint policy severities must remain explicit literals",
            );
            const name = isStringLiteral(property.name)
              ? property.name.text
              : property.name.getText(source);
            assert.ok(
              setting.text === "error" || setting.text === "2",
              `Every explicit policy severity must be an error: ${name}`,
            );
            rules.set(name, setting.text);
          }
        }
        node.forEachChild(collectRuleSettings);
      }
      collectRuleSettings(source);
      assert.ok(rules.size > 0, "Project lint configuration must declare policy rules");
      return { rules };
    } finally {
      snapshot.dispose();
    }
  } finally {
    api.close();
  }
}
const configuredPolicy = readConfiguredLintPolicy();
interface ProjectLintOutput {
  readonly status: 0 | 1;
  readonly stdout: string;
}

async function executeProjectLint(args: readonly string[]): Promise<ProjectLintOutput> {
  return new Promise((resolve, reject) => {
    execFile(
      vitePlusCommand,
      ["exec", "vp", "lint", ...args],
      { cwd: projectRoot, encoding: "utf8", timeout: 30_000, maxBuffer: 16 * 1024 * 1024 },
      (error_, stdout): void => {
        if (error_ === null) {
          resolve({ status: 0, stdout });
        } else if (error_.code === 1) {
          resolve({ status: 1, stdout });
        } else {
          reject(new Error("Lint policy subprocess failed", { cause: error_ }));
        }
      },
    );
  });
}

const effectiveOutput = await executeProjectLint(["--print-config"]);
assert.equal(effectiveOutput.status, 0, "Reading effective lint policy must succeed");
const effectivePolicy = lintPolicySchema.parse(JSON.parse(effectiveOutput.stdout));

async function readRejectedProjectLintDiagnostics(
  args: readonly string[],
): Promise<readonly LintReturnTypeDiagnostic[]> {
  const output = await executeProjectLint(args);
  assert.equal(output.status, 1, "Intentional policy violations must produce lint exit status 1");
  const diagnostics = parseLintReturnTypeDiagnostics(output.stdout);
  for (const diagnostic of diagnostics) {
    assert.equal(diagnostic.severity, "error", "Intentional policy violations must be errors");
  }
  return diagnostics;
}

interface CompatibilityManifest {
  readonly byRule: Readonly<Record<string, Readonly<Record<string, number>>>>;
}
const approvedCompatibilityManifest = {
  byRule: {
    "unicorn/no-null": {
      "apps/web/app/db/repo/location-form.ts": 3,
      "apps/web/app/db/repo/user.ts": 3,
      "apps/web/app/fragno/forms-server.ts": 1,
      "apps/web/app/fragno/stripe-durable-object.ts": 1,
      "apps/web/app/fragno/stripe-server.ts": 2,
      "apps/web/app/lib/bulk-import-helpers.ts": 1,
      "apps/web/app/lib/memberships.ts": 1,
      "apps/web/app/routes/dashboard/dashboard-layout.tsx": 1,
      "apps/web/app/routes/dashboard/forms/submission-export.test.ts": 4,
      "apps/web/app/routes/dashboard/membership-billing.test.ts": 1,
      "apps/web/app/routes/dashboard/membership.tsx": 2,
      "apps/web/app/routes/dashboard/stripe.tsx": 2,
      "apps/web/app/routes/login/login.tsx": 1,
    },
    "anti-slop/no-runtime-typeof": {
      "apps/web/app/components/ui/form-builder/schema-parser.ts": 2,
      "apps/web/app/db/postgres/is3a-postgres.ts": 1,
      "apps/web/app/fragno/database-adapter.ts": 1,
      "apps/web/app/lib/date-utils.ts": 1,
      "apps/web/app/lib/sql.ts": 3,
      "apps/web/app/routes/dashboard/forms/submission-export.ts": 1,
      "packages/design-system/src/components/sidebar.tsx": 2,
    },
    "jsx-a11y/prefer-tag-over-role": { "packages/design-system/src/components/field.tsx": 1 },
    "unicorn/no-document-cookie": { "packages/design-system/src/components/sidebar.tsx": 1 },
    "typescript/require-await": { "apps/web/app/fragno/otp-server.ts": 1 },
    "no-redeclare": { "packages/one-time-password-fragment/src/ott/ott.ts": 1 },
  },
} satisfies CompatibilityManifest;

function maintainedSourcePaths(): string[] {
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
    cwd: projectRoot,
    encoding: "utf8",
  })
    .split("\0")
    .filter(
      (filename) =>
        /\.[cm]?[jt]sx?$/u.test(filename) &&
        existsSync(path.join(projectRoot, filename)) &&
        !effectivePolicy.ignorePatterns.some((pattern) => path.matchesGlob(filename, pattern)),
    );
}

function compatibilityRulesInSource(filename: string, source: string): readonly string[] {
  const rules: string[] = [];
  const candidatePattern = /\b(?:oxlint|eslint)-(?:disable|enable)\b/gu;
  const exactDirectivePattern = new RegExp(
    String.raw`^// oxlint-disable-next-line ([a-z][a-z0-9/-]*(?:,\s*[a-z][a-z0-9/-]*)*) -- COMPATIBILITY: (\S.+)$`,
    "u",
  );
  for (const [index, line] of source.split("\n").entries()) {
    const occurrences = [...line.matchAll(candidatePattern)];
    if (occurrences.length === 0) {
      continue;
    }
    const location = `${filename}:${index + 1}`;
    const comment = getLeadingCommentRanges(line, 0)?.at(0);
    if (comment !== undefined) {
      const directive = exactDirectivePattern.exec(line.slice(comment.pos, comment.end));
      assert.ok(
        directive !== null,
        `Lint compatibility directives must target one following line and explain its contract: ${location}`,
      );
      const ruleList = directive.at(1);
      assert.ok(ruleList !== undefined);
      rules.push(...ruleList.split(/,\s*/u));
      continue;
    }
    // Tokenize only candidate lines: full-file scanning requires parser-driven regex/template rescans.
    for (const occurrence of occurrences) {
      const offset = occurrence.index;
      const scanner = createScanner(false, LanguageVariant.JSX, line);
      let token = scanner.scan();
      let tokens = 0;
      while (scanner.getTokenEnd() <= offset && token !== SyntaxKind.EndOfFile) {
        assert.ok(
          token !== SyntaxKind.SlashToken &&
            token !== SyntaxKind.SlashEqualsToken &&
            token !== SyntaxKind.TemplateHead,
          `Ambiguous inline lint directives are forbidden: ${location}`,
        );
        tokens += 1;
        assert.ok(tokens <= line.length + 1, `Lint directive scanner must advance: ${location}`);
        token = scanner.scan();
      }
      assert.ok(
        (token === SyntaxKind.StringLiteral ||
          token === SyntaxKind.NoSubstitutionTemplateLiteral) &&
          scanner.getTokenStart() <= offset &&
          scanner.getTokenEnd() > offset,
        `Inline or block lint directives are forbidden: ${location}`,
      );
    }
  }
  return rules;
}

function readCompatibilityManifest(): CompatibilityManifest {
  const manifest: Record<string, Record<string, number>> = {};
  for (const filename of maintainedSourcePaths()) {
    const source = readFileSync(path.join(projectRoot, filename), "utf8");
    for (const rule of compatibilityRulesInSource(filename, source)) {
      const pathCounts = manifest[rule] ?? {};
      pathCounts[filename] = (pathCounts[filename] ?? 0) + 1;
      manifest[rule] = pathCounts;
    }
  }
  return { byRule: manifest };
}

await test("every configured lint rule remains an error without disabling overrides", (): void => {
  for (const [rule, setting] of configuredPolicy.rules) {
    const severity = setting;
    assert.ok(
      severity === "error" || severity === "2",
      `Configured lint rule must remain an error: ${rule}`,
    );
    if (!rule.startsWith("anti-slop/") && !rule.startsWith("vite-plus/")) {
      const printedRule = rule.replace("jsx-a11y/", "jsx_a11y/");
      const effectiveSetting = effectivePolicy.rules[printedRule];
      const effectiveSeverity = Array.isArray(effectiveSetting)
        ? effectiveSetting.at(0)
        : effectiveSetting;
      assert.equal(effectiveSeverity, "deny", `Effective lint rule must remain an error: ${rule}`);
    }
  }
  for (const [rule, setting] of Object.entries(effectivePolicy.rules)) {
    assert.equal(
      Array.isArray(setting) ? setting.at(0) : setting,
      "deny",
      `Effective lint rule must remain an error: ${rule}`,
    );
  }
  for (const override of effectivePolicy.overrides ?? []) {
    for (const [rule, setting] of Object.entries(override.rules ?? {})) {
      const severity = Array.isArray(setting) ? setting.at(0) : setting;
      assert.ok(
        severity === "error" || severity === "deny" || severity === 2,
        `Lint overrides must not disable rules: ${rule}`,
      );
    }
  }
  assert.ok(
    maintainedSourcePaths().includes("tooling/oxlint-plugins/anti-slop/index.ts"),
    "Maintained lint plugin source must remain in the lint audit",
  );
});

await test("real project lint rejects unsafe inputs and typed mutability in maintained tooling", async (): Promise<void> => {
  const fixtureName = `lint-policy-probe-${randomUUID()}`;
  const filename = path.join(projectRoot, "tooling", `${fixtureName}.mts`);
  const pluginFilename = path.join(
    projectRoot,
    "tooling/oxlint-plugins/anti-slop",
    `${fixtureName}.ts`,
  );
  const source = [
    "export const prohibitedPolicyNull: null = null;",
    'export function prohibitedPolicyTypeof(value: string | number): boolean { return typeof value === "string"; }',
    "export function prohibitedPolicyUnknown(value: unknown): unknown { return value; }",
    "export function prohibitedPolicyAssertion(value: string): number { return value as unknown as number; }",
    "export function prohibitedPolicyMutable(values: string[]): number { return values.length; }",
  ].join("\n");
  try {
    writeFileSync(filename, source);
    writeFileSync(pluginFilename, "export const prohibitedPluginNull: null = null;\n");
    const diagnostics = await readRejectedProjectLintDiagnostics([
      filename,
      pluginFilename,
      "--format=json",
    ]);
    const codes = new Set(diagnostics.map((diagnostic) => diagnostic.code));
    for (const code of [
      "unicorn(no-null)",
      "anti-slop(no-runtime-typeof)",
      "anti-slop(no-unknown-parameters)",
      "anti-slop(no-unknown-returns)",
      "anti-slop(no-chained-type-assertions)",
      "anti-slop(require-safety-comment-for-type-assertion)",
      "typescript(no-unsafe-type-assertion)",
      "typescript(prefer-readonly-parameter-types)",
    ]) {
      assert.ok(
        codes.has(code),
        `Project lint must reject the intentional policy violation: ${code}`,
      );
    }
    assert.ok(
      diagnostics.some(
        (diagnostic) =>
          path.resolve(projectRoot, diagnostic.filename) === pluginFilename &&
          diagnostic.code === "unicorn(no-null)",
      ),
      "Maintained lint plugin source must receive project policy diagnostics",
    );
  } finally {
    rmSync(filename, { force: true });
    rmSync(pluginFilename, { force: true });
  }
});

await test("compatibility comments exempt exactly one line and keep neighboring rules active", async (): Promise<void> => {
  const filename = path.join(projectRoot, "tooling", `lint-policy-probe-${randomUUID()}.mts`);
  const source = [
    "// oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: The fixture preserves an explicit nullable wire value.",
    "export const compatiblePolicyNull: null = null;",
    "export const neighboringPolicyNull: null = null;",
    "// oxlint-disable-next-line anti-slop/no-runtime-typeof -- COMPATIBILITY: The fixture discriminates a typed scalar union.",
    'export function compatiblePolicyTypeof(value: string | number, values: string[]): boolean { return values.length > 0 && typeof value === "string"; }',
    'export function neighboringPolicyTypeof(value: string | number): boolean { return typeof value === "string"; }',
  ].join("\n");
  try {
    writeFileSync(filename, source);
    const diagnostics = await readRejectedProjectLintDiagnostics([filename, "--format=json"]);
    for (const [code, expectedLine] of [
      ["unicorn(no-null)", 3],
      ["anti-slop(no-runtime-typeof)", 6],
      ["typescript(prefer-readonly-parameter-types)", 5],
    ] as const) {
      const matches = diagnostics.filter((diagnostic) => diagnostic.code === code);
      assert.equal(matches.length, 1, `Only the neighboring statement should retain ${code}`);
      const offset = matches.at(0)?.labels.at(0)?.span.offset;
      assert.ok(offset !== undefined);
      assert.equal(
        source.slice(0, offset).split("\n").length,
        expectedLine,
        `Compatibility scope must remain one line for ${code}`,
      );
    }
  } finally {
    rmSync(filename, { force: true });
  }
});

await test("source compatibility exceptions match the reviewed rule and path inventory", (): void => {
  assert.deepEqual(readCompatibilityManifest(), approvedCompatibilityManifest);
});

await test("compatibility audit rejects malformed, inline, and block directives but ignores quoted fixtures", (): void => {
  for (const source of [
    "//oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Missing required spacing.",
    "//  oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Extra spacing is not reviewed.",
    "// oxlint-disable unicorn/no-null -- COMPATIBILITY: A file-wide suppression is forbidden.",
    "/* oxlint-disable unicorn/no-null -- COMPATIBILITY: A block suppression is forbidden. */",
    "const value = 1; // oxlint-disable-line unicorn/no-null -- COMPATIBILITY: Inline suppression is forbidden.",
  ]) {
    assert.throws(
      () => compatibilityRulesInSource("audit-probe.ts", source),
      /Lint compatibility directives|Inline or block lint directives/,
    );
  }
  const quotedFixture = JSON.stringify(
    "// oxlint-disable-next-line unicorn/no-null -- COMPATIBILITY: Quoted fixture text is not an active directive.",
  );
  assert.deepEqual(compatibilityRulesInSource("audit-probe.ts", quotedFixture), []);
});
