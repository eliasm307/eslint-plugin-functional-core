// see https://typescript-eslint.io/custom-rules
// see examples at: https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin
// Selectors reference: https://eslint.org/docs/latest/extend/selectors
// ScopeManager reference: https://eslint.org/docs/latest/extend/scope-manager-interface
// Visualise scope: http://mazurov.github.io/escope-demo/

import type { ScopeManager } from "@typescript-eslint/scope-manager";
import { analyze as analyzeScope } from "@typescript-eslint/scope-manager";
import type { TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/dist/json-schema";
import { createPurePathPredicate, createRule, globalUsageIsAllowed } from "../utils.pure";
import { isAssignmentExpressionNode, isIdentifierNode, isMemberExpressionNode, isThisExpressionNode } from "../utils.pure/TSESTree";
import {
  getImmediateScope,
  getResolvedVariable,
  variableIsDefinedInScope as variableIsDefinedInFunctionScope,
  variableIsParameter,
  variableIsImmutable,
  isGlobalVariable,
  isGlobalScopeUsage,
  thisExpressionIsGlobalWhenUsedInScope,
} from "../utils.pure/scope";
import type { AllowedGlobalsValue } from "../utils.pure/types";

export type RuleConfig = {
  allowThrow?: boolean;
  allowIgnoreFunctionCallResult?: boolean;
  allowGlobals?: AllowedGlobalsValue;
};

export type Options = [RuleConfig | undefined];

export type MessageIds =
  | "moduleCannotHaveSideEffectImports"
  | "cannotReferenceGlobalContext"
  | "cannotModifyExternalVariables"
  | "cannotUseExternalMutableVariables"
  | "cannotUseImpureFunctions"
  | "cannotThrowErrors"
  | "cannotImportImpureModules"
  | "cannotModifyThisContext"
  | "cannotIgnoreFunctionCallResult";

const rule = createRule<Options, MessageIds>({
  name: "purity",
  meta: {
    type: "suggestion",
    docs: {
      description: "TBC",
      recommended: false,
    },
    // mixing file and module terminology here for accuracy as it could be a script or module in some cases
    messages: {
      moduleCannotHaveSideEffectImports: "A pure module cannot have imports without specifiers, this is likely a side-effect",
      cannotReferenceGlobalContext: "A pure file/function cannot use global context",
      cannotModifyExternalVariables: "A pure function cannot modify external variables",
      cannotUseExternalMutableVariables: "A pure function cannot use external mutable variables",
      cannotUseImpureFunctions: "A pure file/function cannot use impure functions",
      cannotImportImpureModules: "Pure modules cannot import impure modules",
      cannotThrowErrors: "A pure file/function cannot throw errors",
      cannotModifyThisContext: "A pure file/function cannot modify 'this'",
      cannotIgnoreFunctionCallResult: "A pure file/function cannot ignore function call return values, this is likely a side-effect",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowThrow: {
            type: "boolean",
            description: "Whether to allow throwing errors in pure files/functions",
          },
          allowIgnoreFunctionCallResult: {
            type: "boolean",
          },
          allowGlobals: {
            oneOf: [
              {
                type: "object",
                description: "A map of global variables that are allowed to be used in pure files/functions",
              },
              {
                type: "boolean",
                description: "A boolean to allow/disallow all global usages",
              },
            ],
          },
        } satisfies Record<keyof RuleConfig, JSONSchema4>,
      },
    ],
  },
  defaultOptions: [{}],
  create(ruleContext) {
    const filename = ruleContext.getFilename();
    const globalSettings = ruleContext.settings["functional-core"];
    const isPureModulePath = createPurePathPredicate({
      filename,
      customPureModulePatterns: globalSettings?.pureModules,
    });

    // todo allow items in impure modules to be marked as pure
    // todo make pattern for pure module paths configurable
    const isPureFile = isPureModulePath(filename);
    if (!isPureFile) {
      return {}; // impure modules can do whatever they want
    }

    const nodesWithExistingIssues = new WeakSet<TSESTree.Node>();
    function reportIssue({ node, messageId }: { node: TSESTree.Node; messageId: MessageIds }): void {
      if (nodesWithExistingIssues.has(node)) {
        return;
      }

      // todo this should add all child nodes to the set as well
      nodesWithExistingIssues.add(node);
      ruleContext.report({
        node,
        messageId,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sourceCode = ruleContext.getSourceCode();
    const ruleConfig = ruleContext.options[0] || {};
    let scopeManager: ScopeManager;

    function getUsageData(node: TSESTree.MemberExpression | TSESTree.Identifier | TSESTree.ThisExpression): {
      accessSegments: string[];
      isGlobalUsage: boolean;
    } | void {
      let accessSegmentNodes: (TSESTree.Identifier | TSESTree.ThisExpression)[] = [];
      if (isIdentifierNode(node) || isThisExpressionNode(node)) {
        accessSegmentNodes = [node];
      } else if (isMemberExpressionNode(node)) {
        // make sure we are using the top level member expression
        while (isMemberExpressionNode(node.parent)) {
          node = node.parent;
        }
        accessSegmentNodes = [];
        for (const chainNode of getMemberExpressionChainNodes(node)) {
          if (!isIdentifierNode(chainNode) && !isThisExpressionNode(chainNode)) {
            const chainNodeText = sourceCode.getText(chainNode);
            const memberExpressionText = sourceCode.getText(node);
            console.warn(`Unexpected node type: ${chainNode.type} (${chainNodeText}) in MemberExpression "${memberExpressionText}")`);
            return; // unsupported member expression format so we can't determine the usage
          }
          accessSegmentNodes.push(chainNode);
        }
      } else {
        throw new Error(`Unexpected node type: ${(node as TSESTree.Node).type}\n\n${sourceCode.getText(node)}`);
      }

      if (accessSegmentNodes.length === 0) {
        throw new Error(`Unexpected node type: ${node.type}\n\n${sourceCode.getText(node)}`);
      }

      const currentScope = getImmediateScope({ node, scopeManager });
      const rootIdentifier = accessSegmentNodes[0];
      return {
        accessSegments: accessSegmentNodes.map((segmentNode) => {
          return isThisExpressionNode(segmentNode) ? "this" : segmentNode.name;
        }),
        isGlobalUsage: isGlobalScopeUsage({ node: rootIdentifier, scope: currentScope }),
      };
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
        if (!isPureModulePath(node.source.value)) {
          reportIssue({
            node,
            messageId: "cannotImportImpureModules",
          });
        }
      },
      ThisExpression(node) {
        const currentScope = getImmediateScope({ node, scopeManager });
        if (thisExpressionIsGlobalWhenUsedInScope(currentScope)) {
          const directGlobalUsageAllowed = ruleConfig.allowGlobals === true;
          if (!directGlobalUsageAllowed) {
            reportIssue({ node, messageId: "cannotReferenceGlobalContext" });
          }
        }
      },
      "AssignmentExpression, UpdateExpression": function (node: TSESTree.AssignmentExpression | TSESTree.UpdateExpression) {
        const targetNode = isAssignmentExpressionNode(node) ? node.left : node.argument;

        // is variable reassignment?
        if (isIdentifierNode(targetNode)) {
          const currentScope = getImmediateScope({ node, scopeManager });
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
            const currentScope = getImmediateScope({ node, scopeManager });
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
          const currentScope = getImmediateScope({ node, scopeManager });
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
          const currentScope = getImmediateScope({ node, scopeManager });
          const variable = getResolvedVariable({ node: node.callee, scope: currentScope });
          if (!isGlobalVariable(variable)) {
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
      // top member expressions or standalone identifiers (defining these cases explicitly to avoid false positives)
      ":not(MemberExpression) > MemberExpression, Property > Identifier.value": function (
        node: TSESTree.MemberExpression | TSESTree.Identifier,
      ) {
        const usage = getUsageData(node);
        if (!usage) {
          return;
        }
        const { isGlobalUsage, accessSegments } = usage;
        if (!isGlobalUsage || globalUsageIsAllowed({ accessSegments, allowedGlobals: ruleConfig.allowGlobals })) {
          return;
        }
        reportIssue({ node, messageId: "cannotReferenceGlobalContext" });
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
        if (ruleConfig.allowIgnoreFunctionCallResult) {
          return;
        }
        if (isIdentifierNode(node.callee) || isMemberExpressionNode(node.callee)) {
          const usage = getUsageData(node.callee);
          if (!usage) {
            return;
          }
          const { isGlobalUsage, accessSegments } = usage;
          if (isGlobalUsage && globalUsageIsAllowed({ accessSegments, allowedGlobals: ruleConfig.allowGlobals })) {
            return;
          }
        }
        reportIssue({ node, messageId: "cannotIgnoreFunctionCallResult" });
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

function isPureGlobalFunctionName(name: string): boolean {
  return PURE_GLOBAL_FUNCTION_NAMES.has(name);
}

function getMemberExpressionChainNodes(node: TSESTree.Node): TSESTree.Node[] {
  if (isMemberExpressionNode(node)) {
    return [...getMemberExpressionChainNodes(node.object), node.property];
  }
  return [node];
}

export default rule;
