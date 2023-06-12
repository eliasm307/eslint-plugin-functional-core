// see https://typescript-eslint.io/custom-rules
// see examples at: https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin
// Selectors reference: https://eslint.org/docs/latest/extend/selectors
// ScopeManager reference: https://eslint.org/docs/latest/extend/scope-manager-interface

import { isIdentifier } from "typescript";
import { createRule } from "../utils";
import { analyze as analyzeScope, ScopeManager, Scope, Variable } from "@typescript-eslint/scope-manager";
import { isIdentifierNode, isMemberExpressionNode } from "../util/TSESTree-predicates";
import { TSESTree } from "@typescript-eslint/utils";

export type Options = [];
export type MessageIds =
  | ""
  | "moduleCannotHaveSideEffectImports"
  | "cannotReferenceGlobalContext"
  | "cannotModifyExternalVariables"
  | "cannotUseExternalMutableVariables";

function getScope({ node, scopeManager }: { node: TSESTree.Node; scopeManager: ScopeManager }): Scope | void {
  while (node) {
    const scope = scopeManager.acquire(node);
    if (scope) {
      return scope;
    }
    node = node.parent!;
  }
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
      moduleCannotHaveSideEffectImports:
        "A pure module cannot have imports without specifiers, this is likely a side-effect",
      cannotReferenceGlobalContext: "Code in a pure module cannot use global context",
      cannotModifyExternalVariables: "Code in a pure module cannot modify external variables",
      cannotUseExternalMutableVariables: "Code in a pure module cannot use external variables",
    },
    schema: [],
  },
  defaultOptions: [],
  create(ruleContext) {
    // todo allow items in impure modules to be marked as pure
    // todo make pattern for pure module paths configurable
    const filename = ruleContext.getFilename();
    const isPureModule = /\.pure\b/.test(filename);

    if (!isPureModule) {
      console.log(`Skipping purity check for impure module: ${filename}`);
      return {}; // impure modules can do whatever they want
    }

    let scopeManager: ScopeManager;

    return {
      Program(node) {
        scopeManager = analyzeScope(node, {
          impliedStrict: true,
        });
      },
      ImportDeclaration(node) {
        debugger;
        if (node.specifiers.length === 0) {
          ruleContext.report({
            node,
            messageId: "moduleCannotHaveSideEffectImports",
          });
        }
      },
      ThisExpression(node) {
        ruleContext.report({
          node,
          messageId: "cannotReferenceGlobalContext",
        });
      },
      "Identifier[name=globalThis], Identifier[name=window]"(node) {
        ruleContext.report({
          node,
          messageId: "cannotReferenceGlobalContext",
        });
      },
      AssignmentExpression(node) {
        // is variable reassignment?
        if (isIdentifierNode(node.left)) {
          const currentScope = getScope({ node, scopeManager });
          if (!currentScope) {
            return;
          }
          const assignmentTargetIdentifier = node.left;
          const variable = getScopeVariable({ node: assignmentTargetIdentifier, scope: currentScope });
          if (variable?.scope === currentScope) {
            return; // assignment to a variable in the current scope is fine
          }

          ruleContext.report({
            node,
            messageId: "cannotModifyExternalVariables",
          });
          return;
        }

        // is reference variable mutation?
        if (isMemberExpressionNode(node.left)) {
          const rootExpressionObject = getMemberExpressionRootObjectNode(node.left);
          if (!rootExpressionObject) {
            return; // ? when would this be undefined?
          }
          const currentScope = getScope({ node, scopeManager });
          if (!currentScope) {
            return;
          }
          const variable = getScopeVariable({ node: rootExpressionObject, scope: currentScope });
          if (variable?.scope === currentScope) {
            return; // assignment to a reference variable in the current scope is fine
          }

          ruleContext.report({
            node,
            messageId: "cannotModifyExternalVariables",
          });
        }
      },
      ReturnStatement(node) {
        if (isIdentifierNode(node.argument)) {
          const currentScope = getScope({ node, scopeManager });
          if (!currentScope) {
            return;
          }
          const variable = getScopeVariable({ node: node.argument as TSESTree.Identifier, scope: currentScope });
          if (variable?.scope === currentScope) {
            return; // assignment to a variable in the current scope is fine
          }
          ruleContext.report({
            node,
            messageId: "cannotUseExternalMutableVariables",
          });
        }

        // todo account for multiple return arguments as sequence expression
      },
    };
  },
});

function getScopeVariable({ node, scope }: { node: TSESTree.Identifier; scope: Scope }): Variable | void {
  return scope.variables.find((variable) => {
    return variable.name === node.name;
  });
}

function getMemberExpressionRootObjectNode(node: TSESTree.MemberExpression): TSESTree.Identifier | void {
  if (isIdentifierNode(node.object)) {
    return node.object;
  }
  if (isMemberExpressionNode(node.object)) {
    return getMemberExpressionRootObjectNode(node.object);
  }
}

export default rule;
