import type { Scope, ScopeManager, Variable } from "@typescript-eslint/scope-manager";
import type { TSESTree } from "@typescript-eslint/utils";
import { ScopeType } from "@typescript-eslint/scope-manager";
import { isLiteralNode, isTemplateLiteralNode } from "./TSESTree-predicates";

// todo update to use recursion
export function getScope({ node, scopeManager }: { node: TSESTree.Node | undefined; scopeManager: ScopeManager }): Scope {
  while (node) {
    const scope = scopeManager.acquire(node);
    if (scope) {
      return scope;
    }
    node = node.parent;
  }
  // when would this happen?
  throw new Error("Could not find scope");
}

export function variableIsParameter(variable: Variable | undefined): boolean {
  return variable?.defs.some((def) => def.type === "Parameter") ?? false;
}

export function variableIsDefinedInScope(variable: Variable | undefined, scope: Scope): boolean {
  const isDefinedInScope = variable?.scope === scope;
  if (isDefinedInScope) {
    return true;
  }

  if (scope.type === ScopeType.function || !scope.upper) {
    return false; // we are at the top of the local function scope
  }

  // this was not the function scope so check the parent scope
  return variableIsDefinedInScope(variable, scope.upper);
}

export function getResolvedVariable({ node, scope }: { node: TSESTree.Identifier; scope: Scope }): Variable | undefined {
  const reference = scope.references.find((ref) => {
    return ref.identifier.name === node.name;
  });

  if (reference?.resolved) {
    return reference.resolved;
  }

  // if the variable cannot be resolved, it is likely a global variable, fallback to getting the scope variable
  return scope.variables.find((variable) => variable.name === node.name);
}

export function variableIsImmutable(variable: Variable | undefined): boolean {
  const definition = variable?.defs[0];
  if (!definition) {
    return false; // global variable, assume mutable
  }

  if (definition.type !== "Variable") {
    return false; // not sure what other types are so assume mutable
  }

  const isPrimitiveValue = isLiteralNode(definition.node?.init) || isTemplateLiteralNode(definition.node?.init);
  return isPrimitiveValue && definition.parent?.kind === "const";
}
