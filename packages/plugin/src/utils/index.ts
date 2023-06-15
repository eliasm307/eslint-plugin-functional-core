import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/eliasm307/eslint-plugin-functional-core/blob/main/docs/rules/${name}.md`,
);
