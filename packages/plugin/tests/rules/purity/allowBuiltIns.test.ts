import rule from "../../../src/rules/purity";
import type { InvalidTestCase, ValidTestCase } from "../../../src/utils.pure/tests";
import { createRuleTester, testCaseInPureFileByDefault } from "../../../src/utils.pure/tests";

const validCases: ValidTestCase[] = [
  {
    name: "can use pure Array methods",
    code: `
      const arr = [1, 2, 3]
      const arr2 = arr.map(x => x + 1)
    `,
  },
];

const invalidCases: InvalidTestCase[] = [
  {
    name: "cannot use impure Array methods (without option)",
    code: `
      const arr = [1, 2, 3]
      arr.push(1)
    `,
    errors: [{ messageId: "cannotUseImpureMethods" }],
  },
];

createRuleTester().run("purity > allowBuiltIns", rule, {
  valid: validCases.map(testCaseInPureFileByDefault),
  invalid: invalidCases.map(testCaseInPureFileByDefault),
});
