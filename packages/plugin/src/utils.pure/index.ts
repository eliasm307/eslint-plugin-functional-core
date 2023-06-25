import type { TSESTree } from "@typescript-eslint/utils";
import { ESLintUtils } from "@typescript-eslint/utils";
import path from "path";
import type { AllowGlobalsValue } from "./types";
import { isCallExpressionNode } from "./TSESTree";

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/eliasm307/eslint-plugin-functional-core/blob/main/docs/rules/${name}.md`,
);

function pathIsRelative(filePath: string): boolean {
  return filePath.startsWith("./") || filePath.startsWith("../");
}

function normalisePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function getNormalisedAbsolutePath({
  pathToResolve,
  fromAbsoluteAbsoluteFilePath: fromAbsoluteFilePath,
}: {
  pathToResolve: string;
  fromAbsoluteAbsoluteFilePath: string;
}): string {
  if (pathIsRelative(pathToResolve)) {
    const absoluteFilePath = path.resolve(path.dirname(fromAbsoluteFilePath), pathToResolve);
    return normalisePath(absoluteFilePath);
  }
  return normalisePath(pathToResolve);
}

export function createPurePathPredicate({
  filename,
  customPureModulePatterns,
}: {
  filename: string;
  customPureModulePatterns: string[] | undefined;
}) {
  const purePathRegexes = customPureModulePatterns?.map((pattern) => new RegExp(pattern)) ?? [];
  purePathRegexes.push(/\.pure\b/);

  return (inputPath: string): boolean => {
    inputPath = getNormalisedAbsolutePath({
      pathToResolve: inputPath,
      fromAbsoluteAbsoluteFilePath: filename,
    });
    return purePathRegexes.some((regex) => regex.test(inputPath));
  };
}

function isGlobalAlias(alias: string): boolean {
  return ["globalThis", "window", "global", "this"].includes(alias);
}

export function globalUsageIsAllowed({
  accessSegmentsNames: accessSegments,
  allowGlobals,
  node,
}: {
  accessSegmentsNames: string[];
  allowGlobals: AllowGlobalsValue | undefined;
  node: TSESTree.Identifier | TSESTree.MemberExpression;
}): boolean {
  if (isGlobalAlias(accessSegments[0])) {
    // ignore global aliases
    accessSegments = accessSegments.slice(1);
  }

  // some global namespaces can be called as functions
  const isNamespaceAccess = accessSegments.length === 1;
  if (isNamespaceAccess && isCallExpressionNode(node.parent)) {
    if (accessSegments[0] === "Date" && !node.parent.arguments.length) {
      // Date without arguments returns the current date and is not pure
      // however with arguments it returns a specific date so can be pure
      return false;
    }
    accessSegments = [...accessSegments, "{{AsFunction}}"];
  }

  if (typeof allowGlobals === "boolean") {
    return allowGlobals; // value defined for global access
  }
  if (typeof allowGlobals !== "object" || allowGlobals === null) {
    return false; // default, child access values not defined
  }

  // check defined scopes
  for (const segment of accessSegments) {
    allowGlobals = allowGlobals[segment];
    if (typeof allowGlobals === "boolean") {
      return allowGlobals;
    }
    if (typeof allowGlobals !== "object" || allowGlobals === null) {
      return false; // cant get the next scope
    }
  }

  return false; // default
}
