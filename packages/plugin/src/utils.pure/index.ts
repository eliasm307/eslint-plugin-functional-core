import { ESLintUtils } from "@typescript-eslint/utils";
import path from "path";

export const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/eliasm307/eslint-plugin-functional-core/blob/main/docs/rules/${name}.md`,
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
    // eslint-disable-next-line functional-core/purity
    inputPath = getNormalisedAbsolutePath({ pathToResolve: inputPath, fromAbsoluteAbsoluteFilePath: filename });
    return isBuiltInPureModuleImport(inputPath) || purePathRegexes.some((regex) => regex.test(inputPath));
  };
}
