import { defineRule } from "vite-plus/lint/plugins";
import type { ESTree, Variable } from "vite-plus/lint/plugins";

type BroadTypeKind = "top" | "object" | "record";

type KnownValueEvidence =
  | { readonly kind: "annotated"; readonly type: ESTree.TSType }
  | { readonly kind: "expression" };

const functionBoundaryTypes = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
  "TSDeclareFunction",
  "TSEmptyBodyFunctionExpression",
]);

function unwrapExpressionParentheses(expression: ESTree.Expression): ESTree.Expression {
  let current = expression;
  while (current.type === "ParenthesizedExpression") {
    current = current.expression;
  }
  return current;
}

function unwrapTypeParentheses(type: ESTree.TSType): ESTree.TSType {
  let current = type;
  while (current.type === "TSParenthesizedType") {
    current = current.typeAnnotation;
  }
  return current;
}

function typeReferenceName(type: ESTree.TSTypeReference): string | undefined {
  return type.typeName.type === "Identifier" ? type.typeName.name : undefined;
}

function isUnknownOrAnyType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type);
  return unwrapped.type === "TSUnknownKeyword" || unwrapped.type === "TSAnyKeyword";
}

function isBroadRecordKeyType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type);
  if (
    unwrapped.type === "TSStringKeyword" ||
    unwrapped.type === "TSNumberKeyword" ||
    unwrapped.type === "TSSymbolKeyword"
  ) {
    return true;
  }
  if (unwrapped.type === "TSUnionType") {
    return unwrapped.types.every(isBroadRecordKeyType);
  }
  return unwrapped.type === "TSTypeReference" && typeReferenceName(unwrapped) === "PropertyKey";
}

function isBroadRecordType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type);

  if (unwrapped.type === "TSTypeReference") {
    if (typeReferenceName(unwrapped) === "Readonly") {
      const inner = unwrapped.typeArguments?.params.at(0);
      return inner !== undefined && isBroadRecordType(inner);
    }

    if (typeReferenceName(unwrapped) !== "Record") {
      return false;
    }
    const parameters = unwrapped.typeArguments?.params ?? [];
    const keyType = parameters.at(0);
    const valueType = parameters.at(1);
    return (
      parameters.length === 2 &&
      keyType !== undefined &&
      valueType !== undefined &&
      isBroadRecordKeyType(keyType) &&
      isUnknownOrAnyType(valueType)
    );
  }

  if (unwrapped.type !== "TSTypeLiteral" || unwrapped.members.length !== 1) {
    return false;
  }
  const member = unwrapped.members.at(0);
  const parameter = member?.type === "TSIndexSignature" ? member.parameters.at(0) : undefined;
  return (
    member?.type === "TSIndexSignature" &&
    member.parameters.length === 1 &&
    parameter !== undefined &&
    isBroadRecordKeyType(parameter.typeAnnotation.typeAnnotation) &&
    isUnknownOrAnyType(member.typeAnnotation.typeAnnotation)
  );
}

function broadTypeKind(type: ESTree.TSType): BroadTypeKind | undefined {
  const unwrapped = unwrapTypeParentheses(type);
  if (unwrapped.type === "TSUnknownKeyword" || unwrapped.type === "TSAnyKeyword") {
    return "top";
  }
  if (unwrapped.type === "TSObjectKeyword") {
    return "object";
  }
  return isBroadRecordType(unwrapped) ? "record" : undefined;
}

function assertedExpression(
  node: ESTree.TSAsExpression | ESTree.TSTypeAssertion,
): ESTree.Expression {
  return unwrapExpressionParentheses(node.expression);
}

function assertionFromExpression(
  expression: ESTree.Expression,
): ESTree.TSAsExpression | ESTree.TSTypeAssertion | undefined {
  const unwrapped = unwrapExpressionParentheses(expression);
  return unwrapped.type === "TSAsExpression" || unwrapped.type === "TSTypeAssertion"
    ? unwrapped
    : undefined;
}

function normalizedTypeText(sourceText: string, type: ESTree.TSType): string {
  return sourceText.slice(type.start, type.end).replaceAll(/\s+/gu, "");
}

function typesHaveSameSyntax(
  sourceText: string,
  left: ESTree.TSType,
  right: ESTree.TSType,
): boolean {
  return (
    normalizedTypeText(sourceText, unwrapTypeParentheses(left)) ===
    normalizedTypeText(sourceText, unwrapTypeParentheses(right))
  );
}

function isDefinitelyObjectType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type);
  if (
    unwrapped.type === "TSArrayType" ||
    unwrapped.type === "TSConstructorType" ||
    unwrapped.type === "TSFunctionType" ||
    unwrapped.type === "TSMappedType" ||
    unwrapped.type === "TSObjectKeyword" ||
    unwrapped.type === "TSTupleType"
  ) {
    return true;
  }
  if (unwrapped.type === "TSTypeLiteral") {
    return unwrapped.members.length > 0;
  }
  if (unwrapped.type === "TSIntersectionType") {
    return unwrapped.types.every(isDefinitelyObjectType);
  }
  if (unwrapped.type === "TSTypeOperator") {
    return unwrapped.operator === "readonly" && isDefinitelyObjectType(unwrapped.typeAnnotation);
  }
  return false;
}

function isDefinitelyNarrowerRecordType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type);
  if (unwrapped.type === "TSTypeLiteral") {
    return unwrapped.members.some((member) => member.type !== "TSIndexSignature");
  }

  if (unwrapped.type !== "TSTypeReference") {
    return false;
  }
  if (typeReferenceName(unwrapped) === "Readonly") {
    const inner = unwrapped.typeArguments?.params.at(0);
    return inner !== undefined && isDefinitelyNarrowerRecordType(inner);
  }
  if (typeReferenceName(unwrapped) !== "Record") {
    return false;
  }

  const parameters = unwrapped.typeArguments?.params ?? [];
  const valueType = parameters.at(1);
  return parameters.length === 2 && valueType !== undefined && !isUnknownOrAnyType(valueType);
}

/** Treat the program itself as the function boundary for top-level statements. */
function functionBoundary(node: ESTree.Node): ESTree.Node {
  let current = node.parent;
  if (current === null) {
    return node;
  }
  while (current.type !== "Program") {
    if (functionBoundaryTypes.has(current.type)) {
      return current;
    }
    current = current.parent;
  }
  return current;
}

function resolvedVariableForIdentifier(
  scopes: readonly {
    readonly references: readonly {
      readonly identifier: ESTree.Node;
      readonly resolved: Variable | null;
    }[];
  }[],
  identifier: ESTree.IdentifierReference,
): Variable | undefined {
  for (const scope of scopes) {
    const reference = scope.references.find(
      (candidate) =>
        candidate.identifier.start === identifier.start &&
        candidate.identifier.end === identifier.end,
    );
    if (reference !== undefined) {
      return reference.resolved ?? undefined;
    }
  }
  return undefined;
}

function variableDeclarator(variable: Variable): ESTree.VariableDeclarator | undefined {
  for (const definition of variable.defs) {
    if (definition.type === "Variable" && definition.node.type === "VariableDeclarator") {
      return definition.node;
    }
  }
  return undefined;
}

function knownValueEvidence(
  expression: ESTree.Expression,
  scopes: Parameters<typeof resolvedVariableForIdentifier>[0],
  boundary: ESTree.Node,
  visitedVariables: ReadonlySet<Variable>,
): KnownValueEvidence | undefined {
  const unwrapped = unwrapExpressionParentheses(expression);

  if (unwrapped.type === "TSAsExpression" || unwrapped.type === "TSTypeAssertion") {
    if (broadTypeKind(unwrapped.typeAnnotation) !== undefined) {
      return undefined;
    }
    return { kind: "annotated", type: unwrapped.typeAnnotation };
  }

  if (unwrapped.type === "Literal" || unwrapped.type === "TemplateLiteral") {
    return { kind: "expression" };
  }

  if (
    unwrapped.type === "ArrayExpression" ||
    unwrapped.type === "ArrowFunctionExpression" ||
    unwrapped.type === "ClassExpression" ||
    unwrapped.type === "FunctionExpression" ||
    unwrapped.type === "NewExpression" ||
    unwrapped.type === "ObjectExpression"
  ) {
    return { kind: "expression" };
  }

  if (unwrapped.type !== "Identifier") {
    return undefined;
  }
  const variable = resolvedVariableForIdentifier(scopes, unwrapped);
  if (variable === undefined || visitedVariables.has(variable)) {
    return undefined;
  }

  const annotatedIdentifier = variable.identifiers.find(
    (identifier) => identifier.typeAnnotation !== null && identifier.typeAnnotation !== undefined,
  );
  const annotation = annotatedIdentifier?.typeAnnotation?.typeAnnotation;
  if (annotation !== undefined && annotatedIdentifier !== undefined) {
    if (
      functionBoundary(annotatedIdentifier) !== boundary ||
      broadTypeKind(annotation) !== undefined
    ) {
      return undefined;
    }
    return { kind: "annotated", type: annotation };
  }

  const declarator = variableDeclarator(variable);
  if (
    declarator?.parent.type !== "VariableDeclaration" ||
    declarator.parent.kind !== "const" ||
    declarator.init === null ||
    variable.references.some((reference) => reference.isWrite() && !reference.init) ||
    functionBoundary(declarator) !== boundary
  ) {
    return undefined;
  }

  return knownValueEvidence(
    declarator.init,
    scopes,
    boundary,
    new Set([...visitedVariables, variable]),
  );
}

function widenedBinding(
  variable: Variable,
  scopes: Parameters<typeof resolvedVariableForIdentifier>[0],
):
  | {
      readonly broadKind: BroadTypeKind;
      readonly evidence: KnownValueEvidence;
      readonly declaredAt: number;
      readonly boundary: ESTree.Node;
    }
  | undefined {
  const declarator = variableDeclarator(variable);
  if (
    declarator?.parent.type !== "VariableDeclaration" ||
    declarator.parent.kind !== "const" ||
    declarator.id.type !== "Identifier" ||
    declarator.init === null ||
    variable.references.some((reference) => reference.isWrite() && !reference.init)
  ) {
    return undefined;
  }

  const boundary = functionBoundary(declarator);
  const declaredType = declarator.id.typeAnnotation?.typeAnnotation;
  const initializerAssertion = assertionFromExpression(declarator.init);
  const initializerBroadKind =
    initializerAssertion === undefined
      ? undefined
      : broadTypeKind(initializerAssertion.typeAnnotation);
  const declaredBroadKind = declaredType === undefined ? undefined : broadTypeKind(declaredType);
  const broadKind = declaredBroadKind ?? initializerBroadKind;
  if (broadKind === undefined) {
    return undefined;
  }

  const originalExpression =
    initializerAssertion !== undefined && initializerBroadKind !== undefined
      ? assertedExpression(initializerAssertion)
      : declarator.init;
  const evidence = knownValueEvidence(originalExpression, scopes, boundary, new Set([variable]));
  return evidence === undefined
    ? undefined
    : { broadKind, evidence, declaredAt: declarator.end, boundary };
}

function assertionIsNarrower(
  sourceText: string,
  broadKind: BroadTypeKind,
  evidence: KnownValueEvidence,
  assertedType: ESTree.TSType,
): boolean {
  if (broadTypeKind(assertedType) !== undefined) {
    return false;
  }
  if (broadKind === "top") {
    return true;
  }
  if (
    evidence.kind === "annotated" &&
    typesHaveSameSyntax(sourceText, evidence.type, assertedType)
  ) {
    return true;
  }
  if (broadKind === "object") {
    return isDefinitelyObjectType(assertedType);
  }
  return isDefinitelyNarrowerRecordType(assertedType);
}

/** Detect immutable local bindings that erase a known type and are later asserted back to a narrower type. */
export const noWidenThenAssertRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow local const flows that explicitly widen a known value before asserting the widened binding to a narrower type.",
    },
    messages: {
      widenThenAssert:
        'Binding "{{name}}" discards type evidence and later recreates it with an assertion. Keep the precise type from initialization through use; parse boundary input once.',
    },
  },
  create(context) {
    const scopes = context.sourceCode.scopeManager.scopes;

    const checkAssertion = (node: ESTree.TSAsExpression | ESTree.TSTypeAssertion): void => {
      const expression = assertedExpression(node);
      if (expression.type !== "Identifier") {
        return;
      }

      const variable = resolvedVariableForIdentifier(scopes, expression);
      if (variable === undefined) {
        return;
      }
      const widened = widenedBinding(variable, scopes);
      if (
        widened === undefined ||
        node.start <= widened.declaredAt ||
        functionBoundary(node) !== widened.boundary ||
        !assertionIsNarrower(
          context.sourceCode.text,
          widened.broadKind,
          widened.evidence,
          node.typeAnnotation,
        )
      ) {
        return;
      }

      context.report({
        node,
        messageId: "widenThenAssert",
        data: { name: expression.name },
      });
    };

    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    };
  },
});
