import { ESLintUtils } from "@typescript-eslint/utils";
import type { MessageIds, Options } from "../rules/purity";

export type ValidTestCase = ESLintUtils.ValidTestCase<Options>;
export type InvalidTestCase = ESLintUtils.InvalidTestCase<MessageIds, Options>;

export function testCaseInPureFileByDefault<Case extends ValidTestCase | InvalidTestCase>(
  c: Case,
): Case {
  return { filename: "file.pure.ts", ...c };
}

export function createRuleTester() {
  return new ESLintUtils.RuleTester({ parser: "@typescript-eslint/parser" });
}
