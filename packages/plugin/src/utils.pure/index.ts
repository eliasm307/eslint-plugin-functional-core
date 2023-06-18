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

export function getAbsolutePath({
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
  return pathToResolve;
}

export function isBuiltInPureModuleImport(importPath: string): boolean {
  return ["path"].includes(importPath);
}
