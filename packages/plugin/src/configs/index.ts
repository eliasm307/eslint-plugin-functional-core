import type { RuleConfig } from "../rules/purity";
import type { SharedConfigurationSettings } from "../utils.pure/types";

export default {
  recommended: {
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
  },

  strict: {
    settings: {
      purePaths: [".*"], // all files are pure by default
    } satisfies SharedConfigurationSettings,
    rules: {
      "functional-core/purity": [
        "error",
        {
          allowThrow: false,
          allowGlobals: false,
          allowIgnoreFunctionCallResult: false,
          allowMutatingReduceAccumulator: false,
          allowSetters: false,
          allowClassInstanceThisMutations: false,
          allowFunctionWithoutReturn: false,
        } satisfies Required<RuleConfig>,
      ],
    },
  },
};
