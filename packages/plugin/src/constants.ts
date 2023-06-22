import type { AllowedGlobalsValue } from "./utils.pure/types";

export const ALLOW_GLOBALS_DEFAULT: AllowedGlobalsValue = {
  Boolean: true,
  Symbol: true,
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
  } satisfies Record<keyof ObjectConstructor, boolean>,
  console: true,
  require: true,
  module: true,
  describe: true,
  it: true,
  expect: true,
  jest: true,
  process: {
    env: true,
  },
};
