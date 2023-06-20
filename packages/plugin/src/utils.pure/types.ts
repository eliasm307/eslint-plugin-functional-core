declare module "@typescript-eslint/utils/dist/ts-eslint" {
  interface SharedConfigurationSettings {
    "functional-core"?: FunctionalCoreGlobalSettings;
  }
}

export type FunctionalCoreGlobalSettings = {
  /** An array of RegExp patterns that match pure file paths, where this rule will be enabled.
   * File paths including folders or files including '.pure' e.g. 'src/utils.pure/index.ts' or 'src/utils/index.pure.ts'
   * are always considered pure.
   */
  pureModules: string[];
};

export type AllowedGlobalsValue = boolean | { [key: string]: boolean | AllowedGlobalsValue };
