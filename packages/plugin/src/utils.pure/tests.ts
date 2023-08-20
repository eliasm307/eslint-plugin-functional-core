import type { ESLintUtils } from "@typescript-eslint/utils";
// @ts-expect-error [not sure why ts cant resolve this but it does exist]
import { RuleTester } from "@typescript-eslint/rule-tester";
import type { MessageIds, Options } from "../rules/purity";

export type ValidTestCase = ESLintUtils.ValidTestCase<Options>;
export type InvalidTestCase = ESLintUtils.InvalidTestCase<MessageIds, Options>;

const usedTestNames = new Set<string>();

export function testCaseUniqueAndInPureFileByDefault<Case extends ValidTestCase | InvalidTestCase>(
  c: Case,
): Case {
  if (!c.name) {
    throw new Error(`There is a test case missing a name`);
  }
  if (usedTestNames.has(c.name)) {
    throw new Error(`Test name "${c.name}" is not unique`);
  }
  usedTestNames.add(c.name);
  return { filename: "file.pure.ts", ...c };
}

export function createRuleTester() {
  return new RuleTester({
    parser: require.resolve("@typescript-eslint/parser"),
  });
}
