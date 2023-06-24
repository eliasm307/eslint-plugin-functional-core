import type { RuleConfig } from "../rules/purity";

export default {
  rules: {
    "functional-core/purity": [
      "warn",
      {
        allowThrow: true,
        allowIgnoreFunctionCallResult: false,
        allowMutatingReduceAccumulator: true,
      } satisfies RuleConfig,
    ],
  },
};
