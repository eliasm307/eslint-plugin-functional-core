import type { Options, RuleConfig } from "../rules/purity";
import type { AllowGlobalsValue } from "./types";

// ! This is a helper to get a list of methods of an object, but the output from this should be pasted into the object below for clarity
// function allMembersPureExcept<T extends object>(
//   obj: T,
//   impureMemberNames: (keyof T)[],
// ): AllowedGlobalsValue {
//   const methodEntries = Object.getOwnPropertyNames(obj)
//     .filter((key) => typeof obj[key as keyof T] === "function")
//     .map((key) => {
//       return [key, !impureMemberNames.includes(key as keyof T)] as const;
//     });
//   const output = Object.fromEntries(methodEntries);
//   return output;
// }

type MemberBooleanMap<T extends object> = {
  [K in keyof T extends string ? keyof T : never]: boolean;
};

const windowMembers: MemberBooleanMap<Window> = {
  // pure
  decodeURI: true,
  decodeURIComponent: true,
  encodeURI: true,
  encodeURIComponent: true,
  structuredClone: true,
  btoa: true,
  atob: true,
  escape: true,
  unescape: true,
};

const ALLOW_GLOBALS_DEFAULT: AllowGlobalsValue = {
  ...windowMembers,
  Boolean: true,
  Symbol: true,
  Math: {
    // pure
    abs: true,
    acos: true,
    acosh: true,
    asin: true,
    asinh: true,
    atan: true,
    atanh: true,
    atan2: true,
    ceil: true,
    cbrt: true,
    expm1: true,
    clz32: true,
    cos: true,
    cosh: true,
    exp: true,
    floor: true,
    fround: true,
    hypot: true,
    imul: true,
    log: true,
    log1p: true,
    log2: true,
    log10: true,
    max: true,
    min: true,
    pow: true,
    round: true,
    sign: true,
    sin: true,
    sinh: true,
    sqrt: true,
    tan: true,
    tanh: true,
    trunc: true,
    E: true,
    LN10: true,
    LOG10E: true,
    LN2: true,
    LOG2E: true,
    PI: true,
    SQRT1_2: true,
    SQRT2: true,

    // impure
    random: false,
  } satisfies MemberBooleanMap<typeof Math>,
  Object: {
    // pure
    keys: true,
    values: true,
    entries: true,
    getOwnPropertyNames: true,
    getOwnPropertySymbols: true,
    getOwnPropertyDescriptors: true,
    getPrototypeOf: true,
    is: true,
    create: true,
    fromEntries: true,
    getOwnPropertyDescriptor: true,
    isExtensible: true,
    isFrozen: true,
    isSealed: true,
    preventExtensions: true,

    // impure
    assign: false,
    defineProperties: false,
    defineProperty: false,
    setPrototypeOf: false,
    freeze: false, // ?
    seal: false, // ?
    prototype: false, // todo define whats allowed from instances
  } satisfies MemberBooleanMap<typeof Object>,
  console: true,
  require: true,
  module: true,
  describe: true,
  it: true,
  expect: true,
  jest: true,
  // false by default but can be overridden
  process: false,
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
  return {
    allowGlobals: getAllowGlobalsValueWithDefaults(customConfig?.allowGlobals),
    allowIgnoreFunctionCallResult: customConfig?.allowIgnoreFunctionCallResult ?? false,
    allowThrow: customConfig?.allowThrow ?? false,
  };
}
