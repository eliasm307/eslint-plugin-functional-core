// see https://typescript-eslint.io/custom-rules

import { ESLintUtils } from "@typescript-eslint/utils";

export type Options = [];
export type MessageIds = "";

const createRule = ESLintUtils.RuleCreator((name) => `https://example.com/rule/${name}`);

const rule = createRule<Options, MessageIds>({
  name: "purity",
  meta: {
    type: "suggestion",
    docs: {
      description: "TBC",
      recommended: false,
    },
    messages: { "": "" },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {};
  },
});

export default rule;
