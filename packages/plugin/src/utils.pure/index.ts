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

export function isBuiltInPureModuleImport(importPath: string): boolean {
  return ["path"].includes(importPath);
}

export function createPurePathPredicate({
  filename,
  customPureModulePatterns,
}: {
  filename: string;
  customPureModulePatterns: string[] | undefined;
}) {
  const purePathRegexes = customPureModulePatterns?.map((pattern) => new RegExp(pattern)) ?? [];
  // eslint-disable-next-line functional-core/purity
  purePathRegexes.push(/\.pure\b/);

  // todo add tests around this, eg for builtin module handling
  return (inputPath: string): boolean => {
    // todo this should not be an error, need to use TS to know filename is not mutable

    inputPath = getNormalisedAbsolutePath({
      pathToResolve: inputPath,
      fromAbsoluteAbsoluteFilePath: filename,
    });
    return (
      isBuiltInPureModuleImport(inputPath) || purePathRegexes.some((regex) => regex.test(inputPath))
    );
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
  if (isCallExpressionNode(node.parent)) {
    const isNamespaceCallExpression = accessSegments.length === 1;
    if (isNamespaceCallExpression) {
      if (accessSegments[0] === "Date" && !node.parent.arguments.length) {
        // Date without arguments returns the current date and is not pure
        // however with arguments it returns a specific date so can be pure
        return false;
      }
      accessSegments = [...accessSegments, "{{AsFunction}}"];
    }
  }

  // check if global scope has general value
  if (allowGlobals === undefined) {
    return false; // default
  }
  if (typeof allowGlobals === "boolean") {
    return allowGlobals;
  }
  if (typeof allowGlobals !== "object" || allowGlobals === null) {
    return false; // default, cant get global scopes
  }

  // check defined scopes
  for (const segment of accessSegments) {
    allowGlobals = allowGlobals[segment];
    if (allowGlobals === undefined) {
      return false; // default
    }
    if (typeof allowGlobals === "boolean") {
      return allowGlobals;
    }
    if (typeof allowGlobals !== "object" || allowGlobals === null) {
      break; // cant get the next scope anyway
    }
  }

  return false; // default
}
