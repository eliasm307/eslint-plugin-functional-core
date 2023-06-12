import { ESLintUtils } from "@typescript-eslint/utils";
import rule from "../../src/rules/purity";

const ruleTester = new ESLintUtils.RuleTester({
  parser: "@typescript-eslint/parser",
});

ruleTester.run("consistent-indexed-object-style", rule, {
  valid: [],
  invalid: [
    {
      code: "const foo = 1;",
      errors: [{ messageId: "" }],
    },
  ],
});
