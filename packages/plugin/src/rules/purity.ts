// see https://typescript-eslint.io/custom-rules
// see examples at: https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin
// Selectors reference: https://eslint.org/docs/latest/extend/selectors
// ScopeManager reference: https://eslint.org/docs/latest/extend/scope-manager-interface
// Visualise scope: http://mazurov.github.io/escope-demo/

import { analyze as analyzeScope } from "@typescript-eslint/scope-manager";
import type { TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/dist/json-schema";
import { createPurePathPredicate, createRule, globalUsageIsAllowed } from "../utils.pure";
import {
  isArrowFunctionExpressionNode,
  isAssignmentExpressionNode,
  isCallExpressionNode,
  isIdentifierNode,
  isMemberExpressionNode,
  isThisExpressionNode,
} from "../utils.pure/TSESTree";
import {
  getImmediateScope,
  getVariableInScope,
  variableIsDefinedInScope as variableIsDefinedInFunctionScope,
  variableIsParameter,
  variableIsImmutable,
  thisExpressionIsGlobalWhenUsedInScope,
  variableIsImmutableFunctionReference,
  variableIsReduceAccumulatorParameter,
} from "../utils.pure/scope";
import type { AllowGlobalsValue, PurityRuleContext } from "../utils.pure/types";
import { getPurityRuleConfig } from "../utils.pure/config";
import getUsageData from "../utils.pure/getUsageData";

export type RuleConfig = {
  allowThrow?: boolean;
  allowIgnoreFunctionCallResult?: boolean;
  allowGlobals?: AllowGlobalsValue;
  allowMutatingReduceAccumulator?: boolean;
};

export type Options = [RuleConfig | undefined];

export type MessageIds =
  | "moduleCannotHaveSideEffectImports"
  | "cannotReferenceGlobalContext"
  | "cannotMutateExternalVariables"
  | "cannotUseExternalMutableVariables"
  | "cannotUseImpureFunctions"
  | "cannotThrowErrors"
  | "cannotImportImpureModules"
  | "cannotMutateThisContext"
  | "cannotIgnoreFunctionCallResult"
  | "cannotMutateFunctionParameters";

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
      moduleCannotHaveSideEffectImports:
        "A pure module cannot have imports without specifiers, this is likely a side-effect",
      cannotReferenceGlobalContext: "A pure file/function cannot use global context",
      cannotMutateExternalVariables: "A pure function cannot mutate external variables",
      cannotUseExternalMutableVariables: "A pure function cannot use external mutable variables",
      cannotUseImpureFunctions: "A pure file/function cannot use impure functions",
      cannotImportImpureModules: "Pure modules cannot import impure modules",
      cannotThrowErrors: "A pure file/function cannot throw errors",
      cannotMutateThisContext: "A pure file/function cannot mutate 'this'",
      cannotIgnoreFunctionCallResult:
        "A pure file/function cannot ignore function call return values, this is likely a side-effect",
      cannotMutateFunctionParameters: "A pure function cannot mutate parameters",
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
                description:
                  "A map of global variables that are allowed to be used in pure files/functions",
              },
              {
                type: "boolean",
                description: "A boolean to allow/disallow all global usages",
              },
            ],
          },
          allowMutatingReduceAccumulator: {
            type: "boolean",
            description:
              "Whether to allow mutating the accumulator in a reduce function, this is not pure but can be good for performance in some cases",
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

    const {
      allowGlobals,
      allowIgnoreFunctionCallResult,
      allowThrow,
      allowMutatingReduceAccumulator,
    } = getPurityRuleConfig(ruleContext.options);

    const context = {
      sourceCode: ruleContext.getSourceCode(),
    } as PurityRuleContext;

    const nodesWithExistingIssues = new WeakSet<TSESTree.Node>();
    function reportIssue({
      node,
      messageId,
    }: {
      node: TSESTree.Node;
      messageId: MessageIds;
    }): void {
      if (nodesWithExistingIssues.has(node)) {
        return;
      }

      // todo this should add all child nodes to the set as well
      nodesWithExistingIssues.add(node);
      ruleContext.report({ node, messageId });
      // eslint-disable-next-line no-console
      console.log(
        `reporting issue "${messageId}" for node:\n`,
        context.sourceCode.getText(node),
        "\nin parent:\n",
        context.sourceCode.getText(node.parent),
      );
    }

    return {
      Program(node) {
        context.scopeManager = analyzeScope(node, { sourceType: "module" });
      },
      ImportDeclaration(node) {
        if (node.importKind === "type") {
          return; // type imports have no runtime effect and so are pure
        }
        if (node.specifiers.length === 0) {
          reportIssue({ node, messageId: "moduleCannotHaveSideEffectImports" });
          return;
        }
        // todo this should not be an issue with type checking
        if (!isPureModulePath(node.source.value)) {
          reportIssue({ node, messageId: "cannotImportImpureModules" });
        }
      },
      ThisExpression(node) {
        const currentScope = getImmediateScope({ node, scopeManager: context.scopeManager });
        if (thisExpressionIsGlobalWhenUsedInScope(currentScope)) {
          const directGlobalUsageAllowed = allowGlobals === true;
          if (!directGlobalUsageAllowed) {
            reportIssue({ node, messageId: "cannotReferenceGlobalContext" });
            return;
          }
        }
        if (isArrowFunctionExpressionNode(currentScope.block)) {
          // ? make this more specific to this in arrow functions? or just "this" usage in general?
          reportIssue({ node, messageId: "cannotUseExternalMutableVariables" });
        }
      },
      /**
       * Matches on direct reassignment of variables or mutation of variable references
       */
      "AssignmentExpression, UpdateExpression": function (
        node: TSESTree.AssignmentExpression | TSESTree.UpdateExpression,
      ) {
        const targetNode = isAssignmentExpressionNode(node) ? node.left : node.argument;

        // is variable reassignment?
        if (isIdentifierNode(targetNode)) {
          const currentScope = getImmediateScope({ node, scopeManager: context.scopeManager });
          const assignmentTargetIdentifier = targetNode;
          const variable = getVariableInScope({
            node: assignmentTargetIdentifier,
            scope: currentScope,
          });

          if (variableIsDefinedInFunctionScope(variable, currentScope)) {
            // if(variableIsParameter(variable) && is)
            return; // assignment to a variable in the current scope is fine except for parameters
          }

          reportIssue({ node, messageId: "cannotMutateExternalVariables" });
          return;
        }

        // is variable reference mutation?
        if (isMemberExpressionNode(targetNode)) {
          const usage = getUsageData({ node: targetNode, context });
          if (!usage) {
            return; // unsupported member expression format so we can't determine the usage
          }
          const { accessSegmentNodes, accessSegmentsNames: accessSegments, isGlobalUsage } = usage;
          const rootExpressionObject = accessSegmentNodes[0];

          if (isThisExpressionNode(rootExpressionObject)) {
            reportIssue({ node, messageId: "cannotMutateThisContext" });
            return;
          }

          if (isIdentifierNode(rootExpressionObject)) {
            const currentScope = getImmediateScope({ node, scopeManager: context.scopeManager });
            const variable = getVariableInScope({
              node: rootExpressionObject,
              scope: currentScope,
            });

            if (variableIsParameter(variable)) {
              if (
                // todo this should not be an error as the type is primitive and the variable is const
                allowMutatingReduceAccumulator &&
                variableIsReduceAccumulatorParameter(variable)
              ) {
                return;
              }
              reportIssue({ node, messageId: "cannotMutateFunctionParameters" });
              return;
            }

            if (variableIsDefinedInFunctionScope(variable, currentScope)) {
              return; // assignment to a reference variable in the current scope is fine except for parameters
            }

            if (isGlobalUsage && globalUsageIsAllowed({ accessSegments, allowGlobals })) {
              return;
            }

            reportIssue({ node, messageId: "cannotMutateExternalVariables" });
          }
        }
      },
      /**
       * Matches identifier usages then determines if the usages are pure or not
       *
       * @remark Matches top member expressions or standalone identifier usages (defining these cases explicitly to avoid false positives)
       */
      [[
        "ReturnStatement > Identifier.argument",
        "SpreadElement > Identifier.argument",
        "Property > Identifier.value",
        "VariableDeclarator > Identifier.init",
        // Note: Selector is for implicit Arrow function returns
        "ArrowFunctionExpression > Identifier.body",
        "LogicalExpression > Identifier.left",
        "LogicalExpression > Identifier.right",
        "Identifier.test", // for if, while, etc statements
        "CallExpression > Identifier.callee",
        ":not(MemberExpression) > MemberExpression",
      ].join(",")](node: TSESTree.Identifier | TSESTree.MemberExpression) {
        console.log("checking identifier usage", context.sourceCode.getText(node.parent));

        debugger;
        const usage = getUsageData({ node, context });
        if (!usage) {
          return;
        }
        const { isGlobalUsage, accessSegmentsNames: accessSegments, accessSegmentNodes } = usage;
        if (isGlobalUsage) {
          if (!globalUsageIsAllowed({ accessSegments, allowGlobals })) {
            reportIssue({ node, messageId: "cannotReferenceGlobalContext" });
          }
          // ignore any other issues if the global usage is allowed
          return;
        }

        const rootExpressionObject = accessSegmentNodes[0];
        if (isIdentifierNode(rootExpressionObject)) {
          const currentScope = getImmediateScope({ node, scopeManager: context.scopeManager });
          const variable = getVariableInScope({
            node: rootExpressionObject,
            scope: currentScope,
          });
          if (variableIsParameter(variable)) {
            // using any parameter is fine, even from parent functions
            return;
          }
          if (variableIsImmutable(variable)) {
            // using any immutable variable is fine
            return;
          }
          if (isCallExpressionNode(node.parent) && variableIsImmutableFunctionReference(variable)) {
            // functions can be immutable regarding being called as functions
            // however they can still be mutated as objects, so the mutability is conditional
            return;
          }
          if (variableIsDefinedInFunctionScope(variable, currentScope)) {
            return; // using any variable from the current scope is fine, including parameters
          }
          reportIssue({
            node: rootExpressionObject,
            messageId: "cannotUseExternalMutableVariables",
          });
        }

        // todo account for multiple return arguments as sequence expression
      },
      ThrowStatement(node) {
        if (!allowThrow) {
          reportIssue({ node, messageId: "cannotThrowErrors" });
        }
      },
      /**
       * Matches function calls where the return is not captured
       */
      "ExpressionStatement > CallExpression": function (node: TSESTree.CallExpression) {
        // todo this should not be an issue with type checking
        if (allowIgnoreFunctionCallResult) {
          return;
        }
        if (isIdentifierNode(node.callee) || isMemberExpressionNode(node.callee)) {
          const usage = getUsageData({ node: node.callee, context });
          if (!usage) {
            return;
          }
          const { isGlobalUsage, accessSegmentsNames: accessSegments } = usage;
          if (isGlobalUsage && globalUsageIsAllowed({ accessSegments, allowGlobals })) {
            return;
          }
        }
        reportIssue({ node, messageId: "cannotIgnoreFunctionCallResult" });
      },
    };
  },
});

export default rule;
