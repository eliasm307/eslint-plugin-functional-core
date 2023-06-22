import { ESLintUtils } from "@typescript-eslint/utils";
import path from "path";
import type { AllowedGlobalsValue } from "./types";
import { ALLOW_GLOBALS_DEFAULT } from "../constants";

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
    // eslint-disable-next-line functional-core/purity
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
  accessSegments,
  allowedGlobals,
}: {
  accessSegments: string[];
  allowedGlobals: AllowedGlobalsValue | undefined;
}): boolean {
  if (isGlobalAlias(accessSegments[0])) {
    // ignore global aliases
    accessSegments = accessSegments.slice(1);
  }

  // check if global scope has general value
  if (allowedGlobals === undefined) {
    return false; // default
  }
  if (typeof allowedGlobals === "boolean") {
    return allowedGlobals;
  }
  if (typeof allowedGlobals !== "object" || allowedGlobals === null) {
    return false; // default, cant get global scopes
  }

  // check defined scopes
  for (const segment of accessSegments) {
    allowedGlobals = allowedGlobals[segment];
    if (allowedGlobals === undefined) {
      return false; // default
    }
    if (typeof allowedGlobals === "boolean") {
      return allowedGlobals;
    }
    if (typeof allowedGlobals !== "object" || allowedGlobals === null) {
      break; // cant get the next scope anyway
    }
  }

  return false; // default
}

// const PURE_OBJECT_FUNCTION_NAMES = new Set([
//   "freeze",
//   "seal",
//   "preventExtensions",
//   "isFrozen",
//   "isSealed",
//   "isExtensible",
// ] satisfies (keyof ObjectConstructor)[]);

export function applyDeepOverrides(
  original: AllowedGlobalsValue,
  override: AllowedGlobalsValue,
): AllowedGlobalsValue {
  if (typeof original !== "object" || typeof override !== "object") {
    // cannot deep merge so just return the override
    return override;
  }

  const result = { ...original };
  for (const [overrideKey, overrideValue] of Object.entries(override)) {
    result[overrideKey] = applyDeepOverrides(original[overrideKey], overrideValue);
  }
  return result;
}

export function getOverallAllowGlobalsValue(custom: AllowedGlobalsValue): AllowedGlobalsValue {
  return applyDeepOverrides(ALLOW_GLOBALS_DEFAULT, custom);
}
