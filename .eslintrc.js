// @ts-check

const ecmConfig = require("@eliasm307/config/eslint")({ withPrettier: true });

/** @type {import('eslint').Linter.Config & {rules: import('eslint-plugin-functional-core/index').rules}} */
module.exports = {
  ...ecmConfig,
  rules: {
    ...ecmConfig.rules,
    "functional-core/purity": [
      "error",
      {
        allowThrow: true,
        pureModules: ["@typescript-eslint\\/utils", "@typescript-eslint\\/scope-manager"],
      },
    ],
  },
  root: true,
};
