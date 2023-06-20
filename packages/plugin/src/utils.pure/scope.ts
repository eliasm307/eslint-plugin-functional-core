import type { Scope, ScopeManager, Variable } from "@typescript-eslint/scope-manager";
import type { TSESTree } from "@typescript-eslint/utils";
import { ScopeType } from "@typescript-eslint/scope-manager";
import { isArrowFunctionExpressionNode, isLiteralNode, isTemplateLiteralNode, isThisExpressionNode } from "./TSESTree";

const nodeToImmediateScopeMap = new WeakMap<TSESTree.Node, Scope>();

/** Gets the immediate scope from a node */
export function getImmediateScope({ node, scopeManager }: { node: TSESTree.Node | undefined; scopeManager: ScopeManager }): Scope {
  const visitedNodes = new Set<TSESTree.Node>();
  while (node) {
    // eslint-disable-next-line functional-core/purity -- side effect of caching
    visitedNodes.add(node);
    const scope = nodeToImmediateScopeMap.get(node) || scopeManager.acquire(node);
    if (scope) {
      // eslint-disable-next-line functional-core/purity -- side effect of caching
      visitedNodes.forEach((visitedNode) => {
        return nodeToImmediateScopeMap.set(visitedNode, scope);
      });
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

export function isGlobalVariable(variable: Variable | undefined): boolean {
  return !variable; // globals wont be resolved to Scope variables
}

function isValidThisScope(scope: Scope): boolean {
  return scope.type === ScopeType.function && !isArrowFunctionExpressionNode(scope.block);
}

function getThisScopeFrom({ fromScope }: { fromScope: Scope }): Scope | null {
  let scope: Scope | null = fromScope;
  while (scope && !isValidThisScope(scope)) {
    scope = scope.upper;
  }
  return scope;
}

export function thisExpressionIsGlobalWhenUsedInScope(scope: Scope): boolean {
  const thisScope = getThisScopeFrom({ fromScope: scope });
  return !thisScope || thisScope.type === ScopeType.global;
}

export function isGlobalScopeUsage({ node, scope }: { node: TSESTree.Identifier | TSESTree.ThisExpression; scope: Scope }): boolean {
  if (isThisExpressionNode(node)) {
    return thisExpressionIsGlobalWhenUsedInScope(scope);
  }
  return isGlobalVariable(getResolvedVariable({ node, scope }));
}
