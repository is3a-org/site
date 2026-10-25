import type { ESTree, Scope, Variable } from "vite-plus/lint/plugins";

import type { LintSourceCodeReader } from "./lint-source-code-reader.ts";

function resolveVariable(
  sourceCode: LintSourceCodeReader,
  identifier: ESTree.IdentifierReference,
): Variable | undefined {
  let scope: Scope | null = sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== undefined) {
      return variable;
    }
    scope = scope.upper;
  }
  return undefined;
}

function isGlobalReflect(sourceCode: LintSourceCodeReader, expression: ESTree.Expression): boolean {
  if (expression.type !== "Identifier" || expression.name !== "Reflect") {
    return false;
  }
  if (sourceCode.isGlobalReference(expression)) {
    return true;
  }
  const variable = resolveVariable(sourceCode, expression);
  return variable === undefined || variable.defs.length === 0;
}

/** Reports whether a call target names one method on the global Reflect object. */
export function isGlobalReflectMethodCall(
  sourceCode: LintSourceCodeReader,
  callee: ESTree.Expression,
  methodName: string,
): boolean {
  if (!("property" in callee) || !("object" in callee) || !("computed" in callee)) {
    return false;
  }
  if (!isGlobalReflect(sourceCode, callee.object)) {
    return false;
  }
  const property = callee.property;
  return callee.computed
    ? property.type === "Literal" && property.value === methodName
    : property.type === "Identifier" && property.name === methodName;
}
