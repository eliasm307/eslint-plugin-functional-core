/* eslint-disable no-undef */
// see https://typescript-eslint.io/custom-rules
// see examples at: https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin
// Selectors reference: https://eslint.org/docs/latest/extend/selectors
// ScopeManager reference: https://eslint.org/docs/latest/extend/scope-manager-interface
// Visualise scope: http://mazurov.github.io/escope-demo/

import { analyze as analyzeScope, Scope, ScopeManager, Variable } from "@typescript-eslint/scope-manager";
import { TSESTree } from "@typescript-eslint/utils";

import {
  isAssignmentExpressionNode,
  isIdentifierNode,
  isMemberExpressionNode,
  isReturnStatementNode,
  isSpreadElementNode as isSpreadElementNode,
  isThisExpressionNode,
} from "../util/TSESTree-predicates";
import { createRule } from "../utils";

export type Options = [
  {
    allowThrow?: boolean;
  },
];
export type MessageIds =
  | ""
  | "moduleCannotHaveSideEffectImports"
  | "cannotReferenceGlobalContext"
  | "cannotModifyExternalVariables"
  | "cannotUseExternalMutableVariables"
  | "cannotUseImpureFunctions"
  | "cannotThrowErrors"
  | "cannotImportImpureModules"
  | "cannotModifyContext";

function getScope({ node, scopeManager }: { node: TSESTree.Node; scopeManager: ScopeManager }): Scope | void {
  while (node) {
    const scope = scopeManager.acquire(node);
    if (scope) {
      return scope;
    }
    node = node.parent!;
  }
}

// todo make pattern configurable
function isPurePath(path: string): boolean {
  return /\.pure\b/.test(path);
}

const rule = createRule<Options, MessageIds>({
  name: "purity",
  meta: {
    type: "suggestion",
    docs: {
      description: "TBC",
      recommended: false,
    },
    messages: {
      "": "TBC",
      moduleCannotHaveSideEffectImports: "A pure module cannot have imports without specifiers, this is likely a side-effect",
      cannotReferenceGlobalContext: "Code in a pure module cannot use global context",
      cannotModifyExternalVariables: "Code in a pure module cannot modify external variables",
      cannotUseExternalMutableVariables: "Code in a pure module cannot use external variables",
      cannotUseImpureFunctions: "Code in a pure module cannot use impure functions",
      cannotImportImpureModules: "Code in a pure module cannot import impure modules",
      cannotThrowErrors: "Code in a pure module cannot throw errors",
      cannotModifyContext: "Code in a pure module cannot modify context",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowThrow: {
            type: "boolean",
          },
        },
      },
    ],
  },
  defaultOptions: [{}],
  create(ruleContext) {
    // todo allow items in impure modules to be marked as pure
    // todo make pattern for pure module paths configurable
    const filename = ruleContext.getFilename();
    const isPureModule = isPurePath(filename);

    if (!isPureModule) {
      console.log(`Skipping purity check for impure module: ${filename}`);
      return {}; // impure modules can do whatever they want
    }

    let scopeManager: ScopeManager;
    const nodesWithIssues = new WeakSet<TSESTree.Node>();

    function reportIssue({ node, messageId }: { node: TSESTree.Node; messageId: MessageIds }): void {
      if (nodesWithIssues.has(node)) return;

      nodesWithIssues.add(node);
      ruleContext.report({
        node,
        messageId,
      });
    }

    return {
      Program(node) {
        scopeManager = analyzeScope(node, {
          impliedStrict: true,
        });
      },
      ImportDeclaration(node) {
        if (node.specifiers.length === 0) {
          reportIssue({
            node,
            messageId: "moduleCannotHaveSideEffectImports",
          });
          return;
        }
        if (!isPurePath(node.source.value)) {
          reportIssue({
            node,
            messageId: "cannotImportImpureModules",
          });
        }
      },
      "Identifier[name=globalThis], Identifier[name=window]"(node) {
        reportIssue({ node, messageId: "cannotReferenceGlobalContext" });
      },
      ThisExpression(node) {
        const currentScope = getScope({ node, scopeManager });
        const isGlobalScope = !currentScope || currentScope.type === "global";
        if (isGlobalScope) {
          reportIssue({ node, messageId: "cannotReferenceGlobalContext" });
          return;
        }
      },
      "AssignmentExpression, UpdateExpression"(node: TSESTree.AssignmentExpression | TSESTree.UpdateExpression) {
        const targetNode = isAssignmentExpressionNode(node) ? node.left : node.argument;
        // is variable reassignment?
        if (isIdentifierNode(targetNode)) {
          // todo track current scope implicitly when visiting functions to avoid re-calculating this a lot e.g. https://github.com/eslint/eslint-scope
          const currentScope = getScope({ node, scopeManager });
          if (!currentScope) {
            return;
          }
          const assignmentTargetIdentifier = targetNode;
          const variable = getScopeVariable({ node: assignmentTargetIdentifier, scope: currentScope });

          if (isDefinedInScope({ variable, scope: currentScope })) {
            return; // assignment to a variable in the current scope is fine
          }

          reportIssue({ node, messageId: "cannotModifyExternalVariables" });
          return;
        }

        // is reference variable mutation?
        if (isMemberExpressionNode(targetNode)) {
          const rootExpressionObject = getMemberExpressionRootObjectNode(targetNode);

          if (isThisExpressionNode(rootExpressionObject)) {
            reportIssue({ node, messageId: "cannotModifyContext" });
            return;
          }

          if (isIdentifierNode(rootExpressionObject)) {
            const currentScope = getScope({ node, scopeManager });
            if (!currentScope) {
              return;
            }
            const variable = getScopeVariable({ node: rootExpressionObject, scope: currentScope });
            if (isDefinedInScope({ variable, scope: currentScope })) {
              return; // assignment to a reference variable in the current scope is fine
            }

            reportIssue({ node, messageId: "cannotModifyExternalVariables" });
          }
        }
      },
      "ReturnStatement, SpreadElement, Property"(node: TSESTree.ReturnStatement | TSESTree.SpreadElement | TSESTree.Property) {
        const valueNode = isReturnStatementNode(node) ? node.argument : isSpreadElementNode(node) ? node.argument : node.value;
        if (isIdentifierNode(valueNode)) {
          const currentScope = getScope({ node, scopeManager });
          if (!currentScope) {
            return;
          }
          const variable = getScopeVariable({ node: valueNode, scope: currentScope });
          if (isDefinedInScope({ variable, scope: currentScope })) {
            return; // assignment to a variable in the current scope is fine
          }
          reportIssue({ node, messageId: "cannotUseExternalMutableVariables" });
        }

        // todo account for multiple return arguments as sequence expression
      },
      CallExpression(node) {
        if (isIdentifierNode(node.callee)) {
          const currentScope = getScope({ node, scopeManager });
          if (!currentScope) {
            // ie is global function?
            // todo check if global function is pure
            if (!isPureGlobalFunctionName(node.callee.name)) {
              reportIssue({ node: node.callee, messageId: "cannotUseImpureFunctions" });
            }
            return;
          }
          const variable = getScopeVariable({ node: node.callee, scope: currentScope });
          const isGlobalFunction = !variable || variable.scope.type === "global";
          if (!isGlobalFunction) {
            // using function from non-global scope is fine assuming it's pure,
            // if its imported this is a different error
            return;
          }
          // todo check if global function is pure
          if (!isPureGlobalFunctionName(node.callee.name)) {
            reportIssue({
              node: node.callee,
              messageId: "cannotUseImpureFunctions",
            });
          }
        }
      },
      ThrowStatement(node) {
        if (!ruleContext.options[0]?.allowThrow) {
          reportIssue({
            node,
            messageId: "cannotThrowErrors",
          });
        }
      },
    };
  },
});

const PURE_OBJECT_FUNCTION_NAMES = new Set([
  "freeze",
  "seal",
  "preventExtensions",
  "isFrozen",
  "isSealed",
  "isExtensible",
] satisfies (keyof ObjectConstructor)[]);

const PURE_GLOBAL_FUNCTION_NAMES = new Set([
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "structuredClone",
  "btoa",
  "atob",
  "escape",
  "unescape",
] satisfies (keyof Window | string)[]);

function isDefinedInScope({ variable, scope }: { variable: Variable | void; scope: Scope }): boolean {
  return variable?.scope === scope && !variable.defs.some((def) => def.type === "Parameter");
}

function isPureGlobalFunctionName(name: string): boolean {
  return PURE_GLOBAL_FUNCTION_NAMES.has(name);
}

function getScopeVariable({ node, scope }: { node: TSESTree.Identifier; scope: Scope }): Variable | void {
  return scope.variables.find((variable) => {
    return variable.name === node.name;
  });
}

function getMemberExpressionRootObjectNode(node: TSESTree.MemberExpression): TSESTree.Node {
  if (!isMemberExpressionNode(node.object)) {
    return node.object;
  }
  return getMemberExpressionRootObjectNode(node.object);
}

export default rule;
