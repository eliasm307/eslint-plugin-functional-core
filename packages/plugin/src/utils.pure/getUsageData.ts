import type { TSESTree } from "@typescript-eslint/utils";
import type { Scope } from "@typescript-eslint/scope-manager";
import {
  isMemberExpressionNode,
  isIdentifierNode,
  isThisExpressionNode,
  isLiteralNode,
} from "./TSESTree";
import { getImmediateScope, isGlobalScopeUsage } from "./scope";
import type { PurityRuleContext } from "./types";

function getMemberExpressionChainNodes(node: TSESTree.Node): TSESTree.Node[] {
  if (isMemberExpressionNode(node)) {
    return [...getMemberExpressionChainNodes(node.object), node.property];
  }
  return [node];
}

type AccessSegmentNode = TSESTree.Identifier | TSESTree.ThisExpression | TSESTree.Literal;

function getAccessSegmentNodes({
  node,
  sourceCode,
}: {
  node: TSESTree.Node;
  sourceCode: PurityRuleContext["sourceCode"];
}): AccessSegmentNode[] | undefined {
  let accessSegmentNodes: AccessSegmentNode[] = [];
  if (isIdentifierNode(node) || isThisExpressionNode(node)) {
    accessSegmentNodes = [node];
  } else if (isMemberExpressionNode(node)) {
    // make sure we are using the top level member expression
    while (isMemberExpressionNode(node.parent)) {
      node = node.parent;
    }
    accessSegmentNodes = [];
    for (const chainNode of getMemberExpressionChainNodes(node)) {
      if (
        !isIdentifierNode(chainNode) &&
        !isThisExpressionNode(chainNode) &&
        !isLiteralNode(chainNode)
      ) {
        return; // unsupported member expression format so we can't determine the usage
      }
      accessSegmentNodes.push(chainNode);
    }
  } else {
    throw new Error(
      `Unexpected node type: ${(node as TSESTree.Node).type}\n\n${sourceCode.getText(node)}`,
    );
  }

  if (accessSegmentNodes.length === 0) {
    throw new Error(`Unexpected node type: ${node.type}\n\n${sourceCode.getText(node)}`);
  }

  return accessSegmentNodes;
}

function nodeToString(segmentNode: AccessSegmentNode): string {
  if (isThisExpressionNode(segmentNode)) {
    return "this";
  }
  if (isLiteralNode(segmentNode)) {
    return String(segmentNode.value);
  }
  return segmentNode.name;
}

export default function getUsageData({
  node,
  context: { scopeManager, sourceCode },
}: {
  node: TSESTree.MemberExpression | TSESTree.Identifier | TSESTree.ThisExpression;
  context: PurityRuleContext;
}):
  | {
      accessSegmentsNames: string[];
      accessSegmentNodes: AccessSegmentNode[];
      isGlobalUsage: boolean;
      immediateScope: Scope;
      rootAccessNode: TSESTree.Identifier | TSESTree.ThisExpression;
    }
  | undefined {
  const accessSegmentNodes = getAccessSegmentNodes({ node, sourceCode });
  if (!accessSegmentNodes) {
    // access format not supported
    return;
  }

  const rootNode = accessSegmentNodes[0];
  if (isLiteralNode(rootNode)) {
    // ignore literal usage
    return;
  }

  const immediateScope = getImmediateScope({ node, scopeManager });
  return {
    accessSegmentNodes,
    accessSegmentsNames: accessSegmentNodes.map(nodeToString),
    isGlobalUsage: isGlobalScopeUsage({
      node: rootNode,
      scope: immediateScope,
    }),
    immediateScope,
    rootAccessNode: rootNode,
  };
}
