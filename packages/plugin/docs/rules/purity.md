# This rule warns about aspects of code that may be impure, and offers options to adjust how strict this is (`functional-core/purity`)

💼⚠️ This rule is enabled in the 🔒 `strict` config. This rule _warns_ in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

## Options

Options are loose by default to allow for gradual adoption, but can be made stricter by setting relevant options to `false`.

- `allowThrow` - _boolean_ (default: `true`) - Allow `throw` statements.
- `allowIgnoreFunctionCallResult` - _boolean_ (default: `true`) - Allow ignoring the result of a function call.
- `allowGlobals` - _object | boolean_ (default: `object`) - Allow specific global variables to be used. If `true`, all globals are allowed. If `true`, no globals are allowed. If an `object`, the keys are the global member names (e.g. `alert`) or namespaces (e.g. `Boolean`) and the values are booleans indicating whether the global is allowed to be used or not. For example, `{ "console": true }` allows the `console` global to be used, but no other globals. **NOTE** User config is merged into the [default config](../../src/configs/ALLOW_GLOBALS_DEFAULT.ts) so if a value is not specified, the default will be used.
- `allowMutatingReduceAccumulator` - _boolean_ (default: `true`) - Allow mutating the accumulator in a `reduce` call. This is not "pure" but in some cases it can be good practice to improve performance.
- `allowSetters` - _boolean_ (default: `true`) - Allow defining setters in objects and classes, these normally result in implicit side effects.
- `allowClassInstanceThisMutations` - _boolean_ (default: `true`) - Allow mutating class instances internally via `this` (e.g. `this.foo = 1`).
- `allowFunctionWithoutReturn` - _boolean_ (default: `true`) - Allow functions without a `return` statement, not having a return likely means the function is creating side effects.
