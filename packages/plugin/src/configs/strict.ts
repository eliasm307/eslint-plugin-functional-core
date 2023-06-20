import type { RuleConfig } from "../rules/purity";
import type { SharedConfigurationSettings } from "../utils.pure/types";

export default {
  extends: [],
  rules: {
    "functional-core/purity": [
      "error",
      {
        allowThrow: false,
        allowGlobals: false,
        allowIgnoreFunctionCallResult: false,
      } satisfies Required<RuleConfig>,
    ],
  },
  settings: {
    pureModules: [".*"], // all files are pure by default
  } satisfies SharedConfigurationSettings,
};
