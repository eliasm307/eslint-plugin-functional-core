import type { RuleConfig } from "../rules/purity";

export default {
  extends: [],
  rules: {
    "functional-core/purity": [
      "error",
      {
        allowThrow: false,
        pureModules: [".*"],
      } satisfies Required<RuleConfig>,
    ],
  },
};
