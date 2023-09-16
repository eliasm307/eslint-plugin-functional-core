import ALLOW_GLOBALS_DEFAULT from "../configs/ALLOW_GLOBALS_DEFAULT";
import type { Options, RuleConfig } from "../rules/purity";
import type { AllowGlobalsValue } from "./types";

// ! This is a helper to get a list of methods of an object, but the output from this should be pasted into the object below for clarity
export function allMembersPureExcept<T extends object>(
  obj: T,
  impureMemberNames: (keyof T)[],
): AllowGlobalsValue {
  const methodEntries = Object.getOwnPropertyNames(obj)
    .filter((key) => typeof obj[key as keyof T] === "function")
    .map((key) => {
      return [key, !impureMemberNames.includes(key as keyof T)] as const;
    });
  const output = Object.fromEntries(methodEntries);
  return output;
}

type StringOnly<T> = T extends string ? T : never;

export type MemberBooleanMap<T extends object> = {
  [K in keyof T as StringOnly<keyof T>]: AllowGlobalsValue;
} & {
  "{{AsFunction}}"?: AllowGlobalsValue;
};

export function applyDeepOverrides(
  original: AllowGlobalsValue,
  override: AllowGlobalsValue,
): AllowGlobalsValue {
  if (override === undefined) {
    // no override so just return the original
    return original;
  }
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

function getAllowGlobalsValueWithDefaults(
  custom: AllowGlobalsValue | undefined,
): AllowGlobalsValue {
  if (custom === undefined) {
    return ALLOW_GLOBALS_DEFAULT;
  }
  return applyDeepOverrides(ALLOW_GLOBALS_DEFAULT, custom);
}

export function getPurityRuleConfig(options: Options): RuleConfig {
  const customConfig = options[0];

  // the default values here should be "loose" so that the user can adopt more strict settings gradually
  // this also makes it easier to add new options in the future without affecting existing setups/configs
  return {
    allowGlobals: getAllowGlobalsValueWithDefaults(customConfig?.allowGlobals),
    allowIgnoreFunctionCallResult: customConfig?.allowIgnoreFunctionCallResult ?? true,
    allowThrow: customConfig?.allowThrow ?? true,
    allowMutatingReduceAccumulator: customConfig?.allowMutatingReduceAccumulator ?? true,
    allowSetters: customConfig?.allowSetters ?? true,
    allowClassInstanceThisMutations: customConfig?.allowClassInstanceThisMutations ?? true,
    allowFunctionWithoutReturn: customConfig?.allowFunctionWithoutReturn ?? true,
    considerFunctionValuesImmutable: customConfig?.considerFunctionValuesImmutable ?? true,
  } satisfies Required<RuleConfig>;
}
