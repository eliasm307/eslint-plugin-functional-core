// see https://typescript-eslint.io/custom-rules
// see examples at: https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin
// Selectors reference: https://eslint.org/docs/latest/extend/selectors
// ScopeManager reference: https://eslint.org/docs/latest/extend/scope-manager-interface
// Visualise scope: http://mazurov.github.io/escope-demo/

import type { ScopeManager } from "@typescript-eslint/scope-manager";
import { analyze as analyzeScope } from "@typescript-eslint/scope-manager";
import type { TSESTree } from "@typescript-eslint/utils";
import { isVariableDeclarator } from "@typescript-eslint/utils/dist/ast-utils";
import { createRule } from "../utils.pure";
import {
  isAssignmentExpressionNode,
  isIdentifierNode,
  isMemberExpressionNode,
  isThisExpressionNode,
  isVariableDeclaratorNode,
} from "../utils.pure/TSESTree-predicates";
import {
  getScope,
  getResolvedVariable,
  variableIsDefinedInScope as variableIsDefinedInFunctionScope,
  variableIsParameter,
  variableIsImmutable,
} from "../utils.pure/scope";

export type Options = [
  | {
      allowThrow?: boolean;
    }
  | undefined,
];

export type MessageIds =
  | "moduleCannotHaveSideEffectImports"
  | "cannotReferenceGlobalContext"
  | "cannotModifyExternalVariables"
  | "cannotUseExternalMutableVariables"
  | "cannotUseImpureFunctions"
  | "cannotThrowErrors"
  | "cannotImportImpureModules"
  | "cannotModifyThisContext"
  | "cannotIgnoreFunctionCallReturnValue";

const rule = createRule<Options, MessageIds>({
  name: "purity",
  meta: {
    type: "suggestion",
    docs: {
      description: "TBC",
      recommended: false,
    },
    messages: {
      moduleCannotHaveSideEffectImports: "A pure module cannot have imports without specifiers, this is likely a side-effect",
      cannotReferenceGlobalContext: "A pure module/function cannot use global context",
      cannotModifyExternalVariables: "A pure function cannot modify external variables",
      cannotUseExternalMutableVariables: "A pure function cannot use external mutable variables",
      cannotUseImpureFunctions: "A pure module/function cannot use impure functions",
      cannotImportImpureModules: "Pure modules cannot import impure modules",
      cannotThrowErrors: "A pure module/function cannot throw errors",
      cannotModifyThisContext: "A pure module/function cannot modify 'this'",
      cannotIgnoreFunctionCallReturnValue:
        "A pure module/function cannot ignore function call return values, this is likely a side-effect",
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
      return {}; // impure modules can do whatever they want
    }

    let scopeManager: ScopeManager;
    const nodesWithIssues = new WeakSet<TSESTree.Node>();
    const ruleConfig = ruleContext.options[0] || {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sourceCode = ruleContext.getSourceCode();

    function reportIssue({ node, messageId }: { node: TSESTree.Node; messageId: MessageIds }): void {
      if (nodesWithIssues.has(node)) {
        return;
      }

      // todo this should add all child nodes to the set as well
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
        if (node.importKind === "type") {
          return; // type imports have no runtime effect and so are pure
        }
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
      "Identifier[name=globalThis], Identifier[name=window]": function (node) {
        reportIssue({ node, messageId: "cannotReferenceGlobalContext" });
      },
      ThisExpression(node) {
        const currentScope = getScope({ node, scopeManager });
        const isGlobalScope = currentScope.type === "global";
        if (isGlobalScope) {
          reportIssue({ node, messageId: "cannotReferenceGlobalContext" });
        }
      },
      "AssignmentExpression, UpdateExpression": function (node: TSESTree.AssignmentExpression | TSESTree.UpdateExpression) {
        const targetNode = isAssignmentExpressionNode(node) ? node.left : node.argument;

        // is variable reassignment?
        if (isIdentifierNode(targetNode)) {
          debugger;
          // todo track current scope implicitly when visiting functions to avoid re-calculating this a lot e.g. https://github.com/eslint/eslint-scope
          const currentScope = getScope({ node, scopeManager });
          const assignmentTargetIdentifier = targetNode;
          const variable = getResolvedVariable({
            node: assignmentTargetIdentifier,
            scope: currentScope,
          });

          if (variableIsDefinedInFunctionScope(variable, currentScope)) {
            // if(variableIsParameter(variable) && is)
            return; // assignment to a variable in the current scope is fine except for parameters
          }

          reportIssue({ node, messageId: "cannotModifyExternalVariables" });
          return;
        }

        // is reference variable mutation?
        if (isMemberExpressionNode(targetNode)) {
          const rootExpressionObject = getMemberExpressionChainNodes(targetNode)[0];

          if (isThisExpressionNode(rootExpressionObject)) {
            reportIssue({ node, messageId: "cannotModifyThisContext" });
            return;
          }

          if (isIdentifierNode(rootExpressionObject)) {
            const currentScope = getScope({ node, scopeManager });
            const variable = getResolvedVariable({
              node: rootExpressionObject,
              scope: currentScope,
            });
            if (variableIsDefinedInFunctionScope(variable, currentScope) && !variableIsParameter(variable)) {
              return; // assignment to a reference variable in the current scope is fine except for parameters
            }

            reportIssue({ node, messageId: "cannotModifyExternalVariables" });
          }
        }
      },
      // Note: Arrow function selector is for implicit returns
      "ReturnStatement, SpreadElement, Property, VariableDeclarator, ArrowFunctionExpression[body.type=Identifier]": function (
        node:
          | TSESTree.ReturnStatement
          | TSESTree.SpreadElement
          | TSESTree.Property
          | TSESTree.VariableDeclarator
          | TSESTree.ArrowFunctionExpression,
      ) {
        let valueNode: TSESTree.Node | null;
        switch (node.type) {
          case "ReturnStatement":
          case "SpreadElement":
            valueNode = node.argument;
            break;

          case "Property":
            valueNode = node.value;
            break;

          case "VariableDeclarator":
            valueNode = node.init;
            break;

          case "ArrowFunctionExpression":
            valueNode = node.body;
            break;

          default:
            throw new Error(`Unexpected node type: ${node.type}`);
        }

        if (isIdentifierNode(valueNode)) {
          const currentScope = getScope({ node, scopeManager });
          const variable = getResolvedVariable({ node: valueNode, scope: currentScope });
          if (variableIsDefinedInFunctionScope(variable, currentScope)) {
            return; // using any variable from the current scope is fine, including parameters
          }
          if (variableIsImmutable(variable)) {
            return; // using any immutable variable is fine
          }
          reportIssue({
            node: valueNode,
            messageId: "cannotUseExternalMutableVariables",
          });
        }

        // todo account for multiple return arguments as sequence expression
      },
      CallExpression(node) {
        if (isIdentifierNode(node.callee)) {
          const currentScope = getScope({ node, scopeManager });
          const variable = getResolvedVariable({
            node: node.callee,
            scope: currentScope,
          });
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
        if (!ruleConfig.allowThrow) {
          reportIssue({
            node,
            messageId: "cannotThrowErrors",
          });
        }
      },
      "ExpressionStatement > CallExpression": function (node: TSESTree.CallExpression) {
        reportIssue({ node, messageId: "cannotIgnoreFunctionCallReturnValue" });
      },
    };
  },
});

// const PURE_OBJECT_FUNCTION_NAMES = new Set([
//   "freeze",
//   "seal",
//   "preventExtensions",
//   "isFrozen",
//   "isSealed",
//   "isExtensible",
// ] satisfies (keyof ObjectConstructor)[]);

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

// todo make pattern configurable
function isPurePath(path: string): boolean {
  return /\.pure\b/.test(path);
}

function isPureGlobalFunctionName(name: string): boolean {
  return PURE_GLOBAL_FUNCTION_NAMES.has(name);
}

function getMemberExpressionChainNodes(node: TSESTree.MemberExpression): TSESTree.Node[] {
  if (!isMemberExpressionNode(node.object)) {
    return [node.object];
  }
  return [...getMemberExpressionChainNodes(node.object), node.property];
}

export default rule;
