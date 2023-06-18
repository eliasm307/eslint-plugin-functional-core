// see https://typescript-eslint.io/custom-rules
// see examples at: https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin
// Selectors reference: https://eslint.org/docs/latest/extend/selectors
// ScopeManager reference: https://eslint.org/docs/latest/extend/scope-manager-interface
// Visualise scope: http://mazurov.github.io/escope-demo/

import type { ScopeManager } from "@typescript-eslint/scope-manager";
import { analyze as analyzeScope } from "@typescript-eslint/scope-manager";
import type { TSESTree } from "@typescript-eslint/utils";
import type { JSONSchema4 } from "@typescript-eslint/utils/dist/json-schema";
import { createRule } from "../utils.pure";
import {
  isAssignmentExpressionNode,
  isIdentifierNode,
  isMemberExpressionNode,
  isThisExpressionNode,
} from "../utils.pure/TSESTree-predicates";
import {
  getScope,
  getResolvedVariable,
  variableIsDefinedInScope as variableIsDefinedInFunctionScope,
  variableIsParameter,
  variableIsImmutable,
  isGlobalVariable,
} from "../utils.pure/scope";

type RuleConfig = {
  allowThrow?: boolean;
  pureModules?: string[];
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
  | "cannotIgnoreFunctionCallReturnValue";

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
      cannotIgnoreFunctionCallReturnValue:
        "A pure file/function cannot ignore function call return values, this is likely a side-effect",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowThrow: {
            type: "boolean",
            description: "Whether to allow throwing errors in pure files/functions",
          },
          // this option is shared so cant split the rule into smaller rules
          pureModules: {
            type: "array",
            description:
              "An array of RegExp patterns that match pure file paths, where this rule will be enabled. \nFile paths including folders or files including '.pure' e.g. 'src/utils.pure/index.ts' or 'src/utils/index.pure.ts' are always considered pure.",
            items: {
              type: "string",
              minLength: 1,
            },
          },
        } satisfies Record<keyof RuleConfig, JSONSchema4>,
      },
    ],
  },
  defaultOptions: [{}],
  create(ruleContext) {
    const ruleConfig = ruleContext.options[0] || {};
    const purePathRegexes = ruleConfig.pureModules?.map((pattern) => new RegExp(pattern)) ?? [];
    purePathRegexes.push(/\.pure\b/);
    function isPureModulePath(path: string): boolean {
      return purePathRegexes.some((regex) => regex.test(path));
    }

    // todo allow items in impure modules to be marked as pure
    // todo make pattern for pure module paths configurable
    const filename = ruleContext.getFilename();
    debugger;
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
    let scopeManager: ScopeManager;
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
        debugger;
        if (isIdentifierNode(node.callee)) {
          const currentScope = getScope({ node, scopeManager });
          const variable = getResolvedVariable({
            node: node.callee,
            scope: currentScope,
          });
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
