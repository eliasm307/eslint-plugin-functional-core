import type { SourceCode } from "@typescript-eslint/utils/dist/ts-eslint";
import type { ScopeManager } from "@typescript-eslint/scope-manager";

declare module "@typescript-eslint/utils/dist/ts-eslint" {
  // @ts-expect-error
  interface SharedConfigurationSettings {
    "functional-core"?: FunctionalCoreGlobalSettings;
  }
}

export type { SharedConfigurationSettings } from "@typescript-eslint/utils/dist/ts-eslint";

export type FunctionalCoreGlobalSettings = {
  /** An array of RegExp patterns that match pure file paths, where this rule will be enabled.
   * File paths including folders or files including '.pure' e.g. 'src/utils.pure/index.ts' or 'src/utils/index.pure.ts'
   * are always considered pure.
   */
  purePaths: string[];
};

export type AllowGlobalsValue = boolean | { [key: string]: boolean | AllowGlobalsValue };

export type PurityRuleContext = {
  scopeManager: ScopeManager;
  sourceCode: SourceCode;
};
