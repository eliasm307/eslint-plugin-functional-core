import type { RuleConfig } from "../rules/purity";
import type { SharedConfigurationSettings } from "../utils.pure/types";

export default {
  rules: {
    "functional-core/purity": [
      "error",
      {
        allowThrow: false,
        allowGlobals: false,
        allowIgnoreFunctionCallResult: false,
        allowMutatingReduceAccumulator: false,
      } satisfies Required<RuleConfig>,
    ],
  },
  settings: {
    purePaths: [".*"], // all files are pure by default
  } satisfies SharedConfigurationSettings,
};
