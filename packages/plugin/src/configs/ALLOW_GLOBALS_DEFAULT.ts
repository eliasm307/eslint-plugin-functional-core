import type { MemberBooleanMap } from "../utils.pure/config";

const ALLOW_GLOBALS_DEFAULT = {
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
  require: true,
  module: true,
  console: true,
  undefined: true,
  NaN: true,
  Infinity: true,
  isNaN: true,
  isFinite: true,
  URL: true,
  URLSearchParams: true,
  ArrayBuffer: true,

  // global testing utils, allowed for testing frameworks
  describe: true,
  it: true,
  jest: true,
  afterEach: true,
  beforeEach: true,
  afterAll: true,
  beforeAll: true,
  test: true,
  // @ts-expect-error
  before: true,
  after: true,
  expect: true,

  // impure
  // false by default but can be overridden
  process: false,

  // namespaces
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

  Array: {
    // pure
    // todo document that this allows calling global namespaces to be pure, but only for global namespaces
    "{{AsFunction}}": true,
    from: true,
    isArray: true,
    of: true,

    // impure
    prototype: false, // todo define whats allowed from instances
  } satisfies MemberBooleanMap<ArrayConstructor>,

  String: {
    // pure
    "{{AsFunction}}": true,
    fromCharCode: true,
    fromCodePoint: true,
    raw: true,

    // impure
    prototype: false, // todo define whats allowed from instances
  } satisfies MemberBooleanMap<StringConstructor>,

  Number: {
    // pure
    "{{AsFunction}}": true,
    isFinite: true,
    isInteger: true,
    isNaN: true,
    isSafeInteger: true,
    parseFloat: true,
    parseInt: true,
    EPSILON: true,
    MAX_SAFE_INTEGER: true,
    MAX_VALUE: true,
    MIN_SAFE_INTEGER: true,
    MIN_VALUE: true,
    NEGATIVE_INFINITY: true,
    POSITIVE_INFINITY: true,
    NaN: true,

    // impure
    prototype: false, // todo define whats allowed from instances
  } satisfies MemberBooleanMap<NumberConstructor>,

  BigInt: {
    // pure
    "{{AsFunction}}": true,
    asIntN: true,
    asUintN: true,

    // impure
    prototype: false, // todo define whats allowed from instances
  } satisfies MemberBooleanMap<BigIntConstructor>,

  Date: {
    // pure
    parse: true,

    // impure
    "{{AsFunction}}": false, // not pure if called without arguments
    now: false,
    prototype: false, // todo define whats allowed from instances
    UTC: false,
  } satisfies MemberBooleanMap<DateConstructor>,

  RegExp: {
    // direct usage allowed but static members are not
    "{{AsFunction}}": true,
  },

  Function: {
    // impure
    prototype: false, // todo define whats allowed from instances
  } satisfies MemberBooleanMap<FunctionConstructor>,

  Set: {
    prototype: false, // todo define whats allowed from instances
  } satisfies MemberBooleanMap<SetConstructor>,

  Map: {
    prototype: false, // todo define whats allowed from instances
  } satisfies MemberBooleanMap<MapConstructor>,

  WeakSet: {
    prototype: false, // todo define whats allowed from instances
  } satisfies MemberBooleanMap<WeakSetConstructor>,

  WeakMap: {
    prototype: false, // todo define whats allowed from instances
  } satisfies MemberBooleanMap<WeakMapConstructor>,

  JSON: {
    // pure
    parse: true,
    stringify: true,
  } satisfies MemberBooleanMap<typeof JSON>,

  Promise: false, // all async code is impure?

  // throwing errors is impure and there is an issue/option for that but they can be returned as values
  Error: true,
} satisfies Partial<MemberBooleanMap<typeof globalThis>>;

export default ALLOW_GLOBALS_DEFAULT;
