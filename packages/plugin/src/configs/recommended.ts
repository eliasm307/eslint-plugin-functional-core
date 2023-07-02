import type { RuleConfig } from "../rules/purity";

export default {
  rules: {
    "functional-core/purity": [
      // warning to allow for gradual adoption
      "warn",
      {
        allowThrow: true,
        allowIgnoreFunctionCallResult: false,
        // can be good for performance so allowed
        allowMutatingReduceAccumulator: true,
        allowGlobals: {}, // dont modify default
        allowSetters: false,
        allowClassInstanceThisMutations: true,
        allowFunctionWithoutReturn: true,
      } satisfies Required<RuleConfig>,
    ],
  },
};
