# Purity (`functional-core/purity`)

💼⚠️ This rule is enabled in the 🔒 `strict` config. This rule _warns_ in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

## Options

- `allowThrow` - _boolean_ (default: `false`) - Allow `throw` statements.
- `allowIgnoreFunctionCallResult` - _boolean_ (default: `false`) - Allow ignoring the result of a function call.
- `allowGlobals` - _object | boolean_ (default: `object`) - Allow specific global variables to be used. If `true`, all globals are allowed. If `false`, no globals are allowed. If an `object`, the keys are the global member names (e.g. `alert`) or namespaces (e.g. `Boolean`) and the values are booleans indicating whether the global is allowed to be used or not. If a global is not specified, the default will be used based on the [default config](../../src/utils.pure/config.ts). For example, `{ "console": true }` allows the `console` global to be used, but no other globals.
- `allowMutatingReduceAccumulator` - _boolean_ (default: `false`) - Allow mutating the accumulator in a `reduce` call. This isnt "pure" but in some cases it can be good practice to improve performance.
