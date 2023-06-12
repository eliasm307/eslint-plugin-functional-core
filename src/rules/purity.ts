// see https://typescript-eslint.io/custom-rules
// see examples at: https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin

import { createRule } from "../utils";

export type Options = [];
export type MessageIds = "";

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
