import { defineRule } from "vite-plus/lint/plugins";
import type { ESTree, Scope, Variable } from "vite-plus/lint/plugins";

import {
  classifyWideningTarget,
  createTypeEnvironment,
  isKnownEvidenceExpression,
  type TypeEnvironment,
  type WideningTarget,
} from "../shared/dictionary-types.ts";
import type { LintSourceCodeReader } from "../shared/lint-source-code-reader.ts";

type FunctionExpression = ESTree.ArrowFunctionExpression | ESTree.Function;

function unwrapExpression(expression: ESTree.Expression): ESTree.Expression {
  let current = expression;
  while (
    current.type === "ParenthesizedExpression" ||
    current.type === "TSAsExpression" ||
    current.type === "TSSatisfiesExpression" ||
    current.type === "TSTypeAssertion" ||
    current.type === "TSNonNullExpression"
  ) {
    current = current.expression;
  }
  return current;
}

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

function variableDeclarator(variable: Variable): ESTree.VariableDeclarator | undefined {
  if (variable.defs.length !== 1) {
    return undefined;
  }
  const definition = variable.defs.at(0);
  return definition?.type === "Variable" && definition.node.type === "VariableDeclarator"
    ? definition.node
    : undefined;
}

function isStableConstVariable(variable: Variable, declarator: ESTree.VariableDeclarator): boolean {
  return (
    declarator.parent.type === "VariableDeclaration" &&
    declarator.parent.kind === "const" &&
    variable.references.every((reference) => reference.init || !reference.isWrite())
  );
}

function hasKnownEvidence(
  sourceCode: LintSourceCodeReader,
  expression: ESTree.Expression,
  visitedVariables = new Set<Variable>(),
): boolean {
  if (isKnownEvidenceExpression(expression)) {
    return true;
  }
  const unwrapped = unwrapExpression(expression);
  if (unwrapped.type !== "Identifier") {
    return false;
  }
  const variable = resolveVariable(sourceCode, unwrapped);
  if (variable === undefined || visitedVariables.has(variable)) {
    return false;
  }
  const declarator = variableDeclarator(variable);
  if (!declarator?.init || !isStableConstVariable(variable, declarator)) {
    return false;
  }
  visitedVariables.add(variable);
  return hasKnownEvidence(sourceCode, declarator.init, visitedVariables);
}

function annotationTarget(
  annotation: ESTree.TSTypeAnnotation | null | undefined,
  environment: TypeEnvironment,
): WideningTarget | undefined {
  return annotation === null || annotation === undefined
    ? undefined
    : classifyWideningTarget(annotation.typeAnnotation, environment);
}

function enclosingFunction(node: ESTree.Node): FunctionExpression | undefined {
  let current = node.parent;
  while (current !== null && current.type !== "Program") {
    if (
      current.type === "ArrowFunctionExpression" ||
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression"
    ) {
      return current;
    }
    current = current.parent;
  }
  return undefined;
}

function sourceKeyName(sourceCode: LintSourceCodeReader, key: ESTree.PropertyKey): string {
  if (key.type === "Identifier" || key.type === "PrivateIdentifier") {
    return key.name;
  }
  if (key.type === "Literal") {
    return String(key.value);
  }
  return sourceCode.getText(key);
}

function functionName(
  sourceCode: LintSourceCodeReader,
  owner: FunctionExpression | undefined,
): string {
  if (owner === undefined) {
    return "anonymous function";
  }
  if (owner.id !== null) {
    return owner.id.name;
  }
  const parent = owner.parent;
  if (parent.type === "VariableDeclarator" && parent.id.type === "Identifier") {
    return parent.id.name;
  }
  if (parent.type === "MethodDefinition") {
    return sourceKeyName(sourceCode, parent.key);
  }
  return "anonymous function";
}

function isEmptyObjectExpression(expression: ESTree.Expression): boolean {
  const unwrapped = unwrapExpression(expression);
  return unwrapped.type === "ObjectExpression" && unwrapped.properties.length === 0;
}

function isDictionaryAccumulatorTarget(destination: WideningTarget): boolean {
  return destination.kind === "open dictionary" || destination.kind === "generic container";
}

function hasParentAssertion(node: ESTree.Node): boolean {
  return node.parent?.type === "TSAsExpression" || node.parent?.type === "TSTypeAssertion";
}

/** Detect sound syntactic cases where a known value is explicitly widened and loses evidence. */
export const noKnownValueWideningRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow syntactically established values from flowing into explicitly broad or anonymous target types that discard useful evidence.",
    },
    messages: {
      widening:
        "The explicit {{target}} type on {{subject}} discards known type evidence. Keep inference, validate with `satisfies`, or use a named owner contract.",
    },
  },
  createOnce(context) {
    let environment: TypeEnvironment | undefined;

    const reportFlow = (
      expression: ESTree.Expression,
      destination: WideningTarget | undefined,
      subject: string,
    ): void => {
      if (destination === undefined) {
        return;
      }
      if (isDictionaryAccumulatorTarget(destination) && isEmptyObjectExpression(expression)) {
        return;
      }
      if (!hasKnownEvidence(context.sourceCode, expression)) {
        return;
      }
      context.report({
        node: expression,
        messageId: "widening",
        data: { subject, target: destination.kind },
      });
    };

    const targetFromAnnotation = (
      annotation: ESTree.TSTypeAnnotation | null | undefined,
    ): WideningTarget | undefined =>
      environment === undefined ? undefined : annotationTarget(annotation, environment);

    return {
      Program(node): void {
        environment = createTypeEnvironment(node);
      },
      VariableDeclarator(node): void {
        if (node.init === null || node.id.type !== "Identifier") {
          return;
        }
        reportFlow(
          node.init,
          targetFromAnnotation(node.id.typeAnnotation),
          `binding \`${node.id.name}\``,
        );
      },
      PropertyDefinition(node): void {
        if (node.value === null) {
          return;
        }
        reportFlow(
          node.value,
          targetFromAnnotation(node.typeAnnotation),
          `property \`${sourceKeyName(context.sourceCode, node.key)}\``,
        );
      },
      AccessorProperty(node): void {
        if (node.value === null) {
          return;
        }
        reportFlow(
          node.value,
          targetFromAnnotation(node.typeAnnotation),
          `property \`${sourceKeyName(context.sourceCode, node.key)}\``,
        );
      },
      AssignmentExpression(node): void {
        if (node.operator !== "=" || node.left.type !== "Identifier") {
          return;
        }
        const variable = resolveVariable(context.sourceCode, node.left);
        if (variable === undefined) {
          return;
        }
        const declarator = variableDeclarator(variable);
        if (declarator?.id.type !== "Identifier") {
          return;
        }
        reportFlow(
          node.right,
          targetFromAnnotation(declarator.id.typeAnnotation),
          `binding \`${declarator.id.name}\``,
        );
      },
      ReturnStatement(node): void {
        if (node.argument === null) {
          return;
        }
        const owner = enclosingFunction(node);
        reportFlow(
          node.argument,
          targetFromAnnotation(owner?.returnType),
          `return value of \`${functionName(context.sourceCode, owner)}\``,
        );
      },
      ArrowFunctionExpression(node): void {
        if (node.body.type === "BlockStatement") {
          return;
        }
        reportFlow(
          node.body,
          targetFromAnnotation(node.returnType),
          `return value of \`${functionName(context.sourceCode, node)}\``,
        );
      },
      TSAsExpression(node): void {
        if (environment === undefined || hasParentAssertion(node)) {
          return;
        }
        reportFlow(
          node.expression,
          classifyWideningTarget(node.typeAnnotation, environment),
          "assertion",
        );
      },
      TSTypeAssertion(node): void {
        if (environment === undefined || hasParentAssertion(node)) {
          return;
        }
        reportFlow(
          node.expression,
          classifyWideningTarget(node.typeAnnotation, environment),
          "assertion",
        );
      },
    };
  },
});
