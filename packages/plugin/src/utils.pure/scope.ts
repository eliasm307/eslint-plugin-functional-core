import type {
  Scope,
  ScopeManager,
  Variable,
  Definition,
  ParameterDefinition,
  VariableDefinition,
  ModuleScope,
} from "@typescript-eslint/scope-manager";
import { DefinitionType, ScopeType } from "@typescript-eslint/scope-manager";
import type { TSESTree } from "@typescript-eslint/utils";
import {
  isArrayExpressionNode,
  isArrowFunctionExpressionNode,
  isCallExpressionNode,
  isFunctionExpressionNode,
  isIdentifierNode,
  isLiteralNode,
  isMemberExpressionNode,
  isProgramNode,
  isTemplateLiteralNode,
  isThisExpressionNode,
} from "./TSESTree";

const nodeToImmediateScopeMap = new WeakMap<TSESTree.Node, Scope>();

function isModuleScope(scope: Scope | undefined): scope is ModuleScope {
  return scope?.type === ScopeType.module;
}

/** Gets the immediate scope from a node */
export function getImmediateScope({
  node,
  scopeManager,
}: {
  node: TSESTree.Node;
  scopeManager: ScopeManager;
}): Scope {
  const visitedNodes = new Set<TSESTree.Node>();
  while (node && !isProgramNode(node)) {
    // eslint-disable-next-line functional-core/purity -- side effect of caching
    visitedNodes.add(node);
    scopeManager.getDeclaredVariables(node);
    const scope = nodeToImmediateScopeMap.get(node) || scopeManager.acquire(node);
    if (scope) {
      // eslint-disable-next-line functional-core/purity -- side effect of caching
      visitedNodes.forEach((visitedNode) => {
        return nodeToImmediateScopeMap.set(visitedNode, scope);
      });
      return scope;
    }
    node = node.parent!;
  }

  if (scopeManager.isModule()) {
    const moduleScope = scopeManager.globalScope?.childScopes[0];
    if (isModuleScope(moduleScope)) {
      return moduleScope;
    }
    throw new Error("Expected module scope to be a module scope");
  }

  if (!scopeManager.globalScope) {
    throw new Error("Expected global scope to be defined");
  }

  return scopeManager.globalScope;
}

function isParameterDefinition(def: Definition): def is ParameterDefinition {
  return def.type === DefinitionType.Parameter;
}

function isVariableDefinition(def: Definition): def is VariableDefinition {
  return def.type === DefinitionType.Variable;
}

export function variableIsParameter(variable: Variable | undefined): boolean {
  return variable?.defs.some(isParameterDefinition) ?? false;
}

function isArray({ node, scope }: { node: TSESTree.Node; scope: Scope }): boolean {
  if (isArrayExpressionNode(node)) {
    return true;
  }

  const resolvedVariable = getVariableInScope({ node, scope });
  if (resolvedVariable) {
    const definition = resolvedVariable.defs[0];

    // we only look at the direct definition of the variable and dont follow up non-literal assignments
    // TS should be used to get types from more complex cases
    const isExplicitArrayVariable =
      isVariableDefinition(definition) && isArrayExpressionNode(definition.node.init);
    if (isExplicitArrayVariable) {
      return true;
    }
  }

  // todo check if this is an array using typescript

  return false;
}

function isArrayReduceCallbackFunctionNode({
  node,
  scope,
}: {
  node: TSESTree.Node;
  scope: Scope;
}): boolean {
  if (!isArrowFunctionExpressionNode(node) && !isFunctionExpressionNode(node)) {
    // cant be a callback
    return false;
  }

  if (!isCallExpressionNode(node.parent)) {
    // not a callback
    return false;
  }

  if (
    !isMemberExpressionNode(node.parent.callee) ||
    !isIdentifierNode(node.parent.callee.property) ||
    node.parent.callee.property.name !== "reduce" ||
    !isArray({ scope, node: node.parent.callee.object })
  ) {
    // not a reduce call
    return false;
  }

  return true;
}

export function variableIsReduceAccumulatorParameter(variable: Variable | undefined): boolean {
  if (!variable) {
    return false;
  }
  const parameterDefinition = variable.defs.find(isParameterDefinition);
  if (!parameterDefinition) {
    return false;
  }

  const functionNode = parameterDefinition.node;
  const parameterNode = parameterDefinition.name;

  const isFirstParameter = functionNode?.params[0] === parameterNode;
  if (!isFirstParameter) {
    // this is not the first parameter so it cannot be the reduce accumulator
    return false;
  }

  return isArrayReduceCallbackFunctionNode({ scope: variable.scope, node: functionNode });
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

export function getVariableInScope({
  node,
  scope,
}: {
  node: TSESTree.Node;
  scope: Scope;
}): Variable | undefined {
  if (!isIdentifierNode(node)) {
    return;
  }
  const reference = scope.references.find((ref) => {
    return ref.identifier.name === node.name;
  });

  if (reference?.resolved) {
    return reference.resolved;
  }

  // if the variable is not used in the scope then look for it in parent scopes
  while (scope) {
    const foundVariable = scope.variables.find((variable) => variable.name === node.name);
    if (foundVariable) {
      return foundVariable;
    }

    scope = scope.upper!;
  }
  return undefined;
}

export function variableIsImmutable(variable: Variable | undefined): boolean {
  const definition = variable?.defs[0];
  if (!definition) {
    return false; // global variable, assume mutable
  }

  if (definition.type === DefinitionType.ImportBinding) {
    return true;
  }

  if (definition.type === DefinitionType.Variable) {
    // todo also use the type checker to determine if the variable is mutable
    const isPrimitiveValue =
      isLiteralNode(definition.node?.init) ||
      isTemplateLiteralNode(definition.node?.init) ||
      isArrowFunctionExpressionNode(definition.node?.init);
    return isPrimitiveValue && definition.parent?.kind === "const";
  }

  return false;
}

/**
 * A list of function definition types that are (relatively) immutable.
 * These can be reassigned in some cases but are not expected to be reassigned.
 */
const IMMUTABLE_FUNCTION_DEFINITION_TYPES = [
  // can be re-assigned but we assume they are not as it is not common
  DefinitionType.ClassName,
  // ie function declarations
  DefinitionType.FunctionName,
];

export function variableIsImmutableFunctionReference(variable: Variable | undefined): boolean {
  const definition = variable?.defs[0];
  if (!definition) {
    return false; // global variable, assume mutable
  }

  if (IMMUTABLE_FUNCTION_DEFINITION_TYPES.includes(definition.type)) {
    return true;
  }

  if (definition.type === DefinitionType.Variable) {
    // todo also use the type checker to determine if the variable is mutable
    const isFunctionValue =
      isArrowFunctionExpressionNode(definition.node?.init) ||
      isFunctionExpressionNode(definition.node?.init);
    return isFunctionValue && definition.parent?.kind === "const";
  }

  return false;
}

export function isGlobalVariable(variable: Variable | undefined): boolean {
  return !variable || variable.scope.type === ScopeType.global;
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

export function isGlobalScopeUsage({
  node,
  scope,
}: {
  node: TSESTree.Identifier | TSESTree.ThisExpression;
  scope: Scope;
}): boolean {
  if (isThisExpressionNode(node)) {
    return thisExpressionIsGlobalWhenUsedInScope(scope);
  }
  const variable = getVariableInScope({ node, scope });
  return isGlobalVariable(variable);
}
