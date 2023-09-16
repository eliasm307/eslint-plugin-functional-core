import type {
  Scope,
  ScopeManager,
  Variable,
  Definition,
  ParameterDefinition,
  VariableDefinition,
  ModuleScope,
  ImportBindingDefinition,
  FunctionScope,
  ClassScope,
  GlobalScope,
  TSEnumNameDefinition,
  ClassNameDefinition,
} from "@typescript-eslint/scope-manager";
import { DefinitionType, ScopeType } from "@typescript-eslint/scope-manager";
import type { TSESTree } from "@typescript-eslint/utils";
import {
  isArrayExpressionNode,
  isArrowFunctionExpressionNode,
  isCallExpressionNode,
  isClassExpressionNode,
  isFunctionExpressionNode,
  isIdentifierNode,
  isLiteralNode,
  isMemberExpressionNode,
  isMethodDefinitionNode,
  isProgramNode,
  isTemplateLiteralNode,
  isThisExpressionNode,
} from "./TSESTree";

const nodeToImmediateScopeMap = new WeakMap<TSESTree.Node, Scope>();

function isModuleScope(scope: Scope | undefined): scope is ModuleScope {
  return scope?.type === ScopeType.module;
}

/** Gets the nearest parent scope from a node */
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

function isParameterDefinition(definition: Definition): definition is ParameterDefinition {
  return definition.type === DefinitionType.Parameter;
}

function isVariableDefinition(definition: Definition): definition is VariableDefinition {
  return definition.type === DefinitionType.Variable;
}

function isImportBindingDefinition(definition: Definition): definition is ImportBindingDefinition {
  return definition.type === DefinitionType.ImportBinding;
}

function isClassDefinition(definition: Definition): definition is ClassNameDefinition {
  return definition.type === DefinitionType.ClassName;
}

function isTsEnumNameDefinition(definition: Definition): definition is TSEnumNameDefinition {
  return definition.type === DefinitionType.TSEnumName;
}

export function variableIsParameter(variable: Variable | undefined): boolean {
  return variable?.defs.some(isParameterDefinition) ?? false;
}

function isArray({ node, scope }: { node: TSESTree.Node; scope: Scope }): boolean {
  if (isArrayExpressionNode(node)) {
    return true;
  }

  const variable = getVariableInScope({ node, scope });
  if (variable) {
    const definition = variable.defs[0];

    // we only look at the direct definition of the variable and dont follow up non-literal assignments
    // TS should be used to get types from more complex cases
    const isLiteralArrayVariable =
      isVariableDefinition(definition) && isArrayExpressionNode(definition.node.init);
    if (isLiteralArrayVariable) {
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
    // cant be a callback if it is not a function
    return false;
  }

  if (!isCallExpressionNode(node.parent)) {
    // not a callback if its not a call expression child
    return false;
  }

  if (
    !isMemberExpressionNode(node.parent.callee) ||
    !isIdentifierNode(node.parent.callee.property) ||
    node.parent.callee.property.name !== "reduce" ||
    !isArray({ scope, node: node.parent.callee.object })
  ) {
    // not an array reduce call
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

  return isArrayReduceCallbackFunctionNode({
    scope: variable.scope,
    node: functionNode,
  });
}

export function variableIsDefinedInCurrentFunctionScope(
  variable: Variable | undefined,
  scope: Scope,
): boolean {
  const isDefinedInScope = variable?.scope === scope;
  if (isDefinedInScope) {
    return true;
  }

  if (isFunctionScope(scope) || !scope.upper) {
    return false; // we are at the top of the local function scope
  }

  // this was not the function scope so check the parent scope
  return variableIsDefinedInCurrentFunctionScope(variable, scope.upper);
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

/** `true` if the variable value cannot be re-assigned or mutated */
export function variableValueIsImmutable(
  variable: Variable | undefined,
  options?: {
    functionsAreImmutable?: boolean;
  },
): boolean {
  const definition = variable?.defs[0];
  if (!definition) {
    return false; // global variable, assume mutable
  }

  if (isImportBindingDefinition(definition) || isTsEnumNameDefinition(definition)) {
    return true;
  }

  if (isClassDefinition(definition) && options?.functionsAreImmutable) {
    return true;
  }

  if (isVariableDefinition(definition)) {
    const isConst = definition.parent?.kind === "const";
    if (!isConst) {
      return false; // variable is mutable ie re-assigning can change the variable value
    }

    const valueNode = definition.node?.init;
    if (options?.functionsAreImmutable) {
      const isFunctionValue =
        isFunctionExpressionNode(valueNode) ||
        isArrowFunctionExpressionNode(valueNode) ||
        isClassExpressionNode(valueNode);
      if (isFunctionValue) {
        return true;
      }
    }

    // todo also use the type checker to determine if the variable is mutable
    const isPrimitiveValue = isLiteralNode(valueNode) || isTemplateLiteralNode(valueNode);
    return isPrimitiveValue;
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

/** `true` if the variable cannot be re-assigned to a different value/reference */
export function variableCannotBeReAssigned(variable: Variable | undefined): boolean {
  const definition = variable?.defs[0];
  if (!definition) {
    return false; // global variable, assume mutable
  }

  if (IMMUTABLE_FUNCTION_DEFINITION_TYPES.includes(definition.type)) {
    return true;
  }

  if (isVariableDefinition(definition)) {
    // if function reference is assigned to const variable then that function reference is immutable
    return definition.parent?.kind === "const";
  }

  return false;
}

export function isGlobalVariable(variable: Variable | undefined): boolean {
  return !variable || variable.scope.type === ScopeType.global;
}

function isValidThisScope(scope: Scope): scope is FunctionScope | ClassScope | GlobalScope {
  if (isClassScope(scope) || isGlobalScope(scope)) {
    return true;
  }
  // todo support scopes from POJOs?
  return (
    isFunctionScope(scope) &&
    // arrow functions use the parent scope
    !isArrowFunctionExpressionNode(scope.block) &&
    // its a method so the scope is the class scope
    !isClassScope(scope.upper)
  );
}

function getThisScopeFrom(initialScope: Scope): FunctionScope | ClassScope | GlobalScope | null {
  let scope: Scope | null = initialScope;
  while (scope && !isValidThisScope(scope)) {
    scope = scope.upper;
  }
  return scope;
}

export function thisExpressionIsGlobalWhenUsedInScope(scope: Scope): boolean {
  const thisScope = getThisScopeFrom(scope);
  return !thisScope || isGlobalScope(thisScope);
}

export function thisExpressionIsClassInstanceWhenUsedInScope(scope: Scope) {
  return isClassScope(getThisScopeFrom(scope));
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

function isFunctionScope(scope: Scope): scope is FunctionScope {
  return scope.type === ScopeType.function;
}

function isClassScope(scope: Scope | null): scope is ClassScope {
  return scope?.type === ScopeType.class;
}

function isGlobalScope(scope: Scope): scope is GlobalScope {
  return scope.type === ScopeType.global;
}

function isWithinClassScope(scope: Scope): boolean {
  while (scope) {
    if (isClassScope(scope)) {
      return true;
    }
    scope = scope.upper!;
  }
  return false;
}

function getImmediateFunctionScopeWithinClass(scope: Scope): FunctionScope | null {
  while (scope) {
    if (isFunctionScope(scope)) {
      return scope;
    }
    if (isClassScope(scope.upper)) {
      // we are within a class but not within a function, how is it possible?
      return null;
    }
    scope = scope.upper!;
  }
  return null;
}

const scopeToImmediateClassMethodDefinitionNodeMap = new WeakMap<
  Scope,
  TSESTree.MethodDefinition
>();

function getImmediateClassMethodDefinitionNodeFromScope(
  scope: Scope,
): TSESTree.MethodDefinition | null {
  const cachedMethodDefinitionNode = scopeToImmediateClassMethodDefinitionNodeMap.get(scope);
  if (cachedMethodDefinitionNode) {
    return cachedMethodDefinitionNode;
  }

  if (!isWithinClassScope(scope)) {
    return null;
  }

  const methodFunctionScope = getImmediateFunctionScopeWithinClass(scope);
  if (!methodFunctionScope) {
    return null;
  }

  const methodDefinitionDefinitionNode =
    isMethodDefinitionNode(methodFunctionScope.block.parent) && methodFunctionScope.block.parent;
  if (!methodDefinitionDefinitionNode) {
    // we are in a class but not directly in the method scope could be a child function
    return null;
  }

  scopeToImmediateClassMethodDefinitionNodeMap.set(scope, methodDefinitionDefinitionNode);
  return methodDefinitionDefinitionNode;
}

export function isClassConstructorScope(scope: Scope): boolean {
  return getImmediateClassMethodDefinitionNodeFromScope(scope)?.kind === "constructor";
}

export function isClassSetterScope(scope: Scope): boolean {
  return getImmediateClassMethodDefinitionNodeFromScope(scope)?.kind === "set";
}
