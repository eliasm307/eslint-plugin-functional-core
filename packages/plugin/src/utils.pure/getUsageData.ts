import type { TSESTree } from "@typescript-eslint/utils";
import type { Scope } from "@typescript-eslint/scope-manager";
import { isMemberExpressionNode, isIdentifierNode, isThisExpressionNode } from "./TSESTree";
import { getImmediateScope, isGlobalScopeUsage } from "./scope";
import type { PurityRuleContext } from "./types";

function getMemberExpressionChainNodes(node: TSESTree.Node): TSESTree.Node[] {
  if (isMemberExpressionNode(node)) {
    return [...getMemberExpressionChainNodes(node.object), node.property];
  }
  return [node];
}

function getAccessSegmentNodes({
  node,
  sourceCode,
}: {
  node: TSESTree.Node;
  sourceCode: PurityRuleContext["sourceCode"];
}): (TSESTree.Identifier | TSESTree.ThisExpression)[] | undefined {
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

export default function getUsageData({
  node,
  context: { scopeManager, sourceCode },
}: {
  node: TSESTree.MemberExpression | TSESTree.Identifier | TSESTree.ThisExpression;
  context: PurityRuleContext;
}):
  | {
      accessSegmentsNames: string[];
      accessSegmentNodes: (TSESTree.Identifier | TSESTree.ThisExpression)[];
      isGlobalUsage: boolean;
      immediateScope: Scope;
      rootNode: TSESTree.Identifier | TSESTree.ThisExpression;
    }
  | undefined {
  const accessSegmentNodes = getAccessSegmentNodes({ node, sourceCode });
  if (!accessSegmentNodes) {
    return;
  }

  const immediateScope = getImmediateScope({ node, scopeManager });
  const rootNode = accessSegmentNodes[0];
  return {
    accessSegmentsNames: accessSegmentNodes.map((segmentNode) => {
      return isThisExpressionNode(segmentNode) ? "this" : segmentNode.name;
    }),
    accessSegmentNodes,
    isGlobalUsage: isGlobalScopeUsage({ node: rootNode, scope: immediateScope }),
    immediateScope,
    rootNode,
  };
}
