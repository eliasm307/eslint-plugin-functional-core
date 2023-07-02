import type { TSESTree } from "@typescript-eslint/utils";

import { AST_NODE_TYPES, ASTUtils } from "@typescript-eslint/utils";
import { isConditionalExpression } from "typescript";

export const isFunctionNode = ASTUtils.isFunction;

// eslint ast node predicates, ASTUtils has some but not all that are required, so defined all the relevant ones here manually for consistency
export const isReturnStatementNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ReturnStatement => node?.type === AST_NODE_TYPES.ReturnStatement;

export const isProgramNode = (node: TSESTree.Node | null | undefined): node is TSESTree.Program =>
  node?.type === AST_NODE_TYPES.Program;

export const isArrowFunctionExpressionNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ArrowFunctionExpression =>
  node?.type === AST_NODE_TYPES.ArrowFunctionExpression;

export const isVariableDeclaratorNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.VariableDeclarator => node?.type === AST_NODE_TYPES.VariableDeclarator;

export const isSpreadElementNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.SpreadElement => node?.type === AST_NODE_TYPES.SpreadElement;

export const isObjectExpressionNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ObjectExpression => node?.type === AST_NODE_TYPES.ObjectExpression;

export const isAssignmentPatternNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.AssignmentPattern => node?.type === AST_NODE_TYPES.AssignmentPattern;

export const isImportSpecifierNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ImportSpecifier => node?.type === AST_NODE_TYPES.ImportSpecifier;

export const isImportDefaultSpecifierNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ImportDefaultSpecifier => node?.type === AST_NODE_TYPES.ImportDefaultSpecifier;

export const isFunctionExpressionNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.FunctionExpression => node?.type === AST_NODE_TYPES.FunctionExpression;

export const isImportDeclarationNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ImportDeclaration => node?.type === AST_NODE_TYPES.ImportDeclaration;

export const isPropertyNode = (node: TSESTree.Node | null | undefined): node is TSESTree.Property =>
  node?.type === AST_NODE_TYPES.Property;

export const isLiteralNode = (node: TSESTree.Node | null | undefined): node is TSESTree.Literal =>
  node?.type === AST_NODE_TYPES.Literal;

export const isTemplateLiteralNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.TemplateLiteral => node?.type === AST_NODE_TYPES.TemplateLiteral;

export const isIdentifierNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.Identifier => node?.type === AST_NODE_TYPES.Identifier;

export const isExportDefaultDeclarationNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ExportDefaultDeclaration =>
  node?.type === AST_NODE_TYPES.ExportDefaultDeclaration;

export const isMemberExpressionNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.MemberExpression => node?.type === AST_NODE_TYPES.MemberExpression;

export const isThisExpressionNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ThisExpression => node?.type === AST_NODE_TYPES.ThisExpression;

export const isCallExpressionNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.CallExpression => node?.type === AST_NODE_TYPES.CallExpression;

export const isArrayExpressionNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ArrayExpression => node?.type === AST_NODE_TYPES.ArrayExpression;

export const isTsAsExpressionNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.TSAsExpression => node?.type === AST_NODE_TYPES.TSAsExpression;

export const isExpressionStatementNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ExpressionStatement => node?.type === AST_NODE_TYPES.ExpressionStatement;

export const isStringLiteralNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.StringLiteral =>
  node?.type === AST_NODE_TYPES.Literal && typeof node.value === "string";

export const isUnaryExpressionNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.UnaryExpression => node?.type === AST_NODE_TYPES.UnaryExpression;

export const isVariableDeclarationNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.VariableDeclaration => node?.type === AST_NODE_TYPES.VariableDeclaration;

export const isAssignmentExpressionNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.AssignmentExpression => node?.type === AST_NODE_TYPES.AssignmentExpression;

export const isMethodDefinitionNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.MethodDefinition => node?.type === AST_NODE_TYPES.MethodDefinition;

export const isLogicalExpressionNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.LogicalExpression => node?.type === AST_NODE_TYPES.LogicalExpression;

export const isIfStatementNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.IfStatement => node?.type === AST_NODE_TYPES.IfStatement;

export const isWhileStatementNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.WhileStatement => node?.type === AST_NODE_TYPES.WhileStatement;

export const isDoWhileStatementNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.DoWhileStatement => node?.type === AST_NODE_TYPES.DoWhileStatement;

export const isSwitchStatementNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.SwitchStatement => node?.type === AST_NODE_TYPES.SwitchStatement;

/** ie an individual case in a SwitchStatement */
export const isSwitchCaseNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.SwitchCase => node?.type === AST_NODE_TYPES.SwitchCase;

/** ie a ternary condition */
export const isConditionalExpressionNode = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ConditionalExpression => node?.type === AST_NODE_TYPES.ConditionalExpression;

/** Gets the top logical expression node */
export function getMainLogicalExpressionNode(
  node: TSESTree.LogicalExpression,
): TSESTree.Node | undefined {
  let current: TSESTree.Node | undefined = node;
  while (isLogicalExpressionNode(current?.parent)) {
    current = current.parent;
  }
  return current;
}

export function isTestConditionNodeForAStatement(node: TSESTree.Node | null | undefined): boolean {
  if (!node?.parent) {
    return false;
  }
  if (isSwitchStatementNode(node.parent)) {
    return node.parent.discriminant === node;
  }
  if (
    isIfStatementNode(node.parent) ||
    isWhileStatementNode(node.parent) ||
    isDoWhileStatementNode(node.parent) ||
    isConditionalExpressionNode(node.parent) ||
    isSwitchCaseNode(node.parent)
  ) {
    return node.parent.test === node;
  }
  return false;
}

export function isReturnArgumentNode(node: TSESTree.Node | null | undefined): boolean {
  if (!node?.parent) {
    return false;
  }
  return isReturnStatementNode(node.parent) && node.parent.argument === node;
}
