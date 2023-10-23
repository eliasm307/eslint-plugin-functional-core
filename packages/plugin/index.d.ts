import type * as rulesImport from "./src/rules";
import type * as configsImport from "./src/configs";
import type { RuleConfig as PurityRuleConfig } from "./src/rules/purity";

export const rules: (typeof rulesImport)["default"];

export const configs: (typeof configsImport)["default"];

export type RuleOptions = {
  purity?: PurityRuleConfig;
};
