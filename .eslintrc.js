// @ts-check

const ecmConfig = require("@eliasm307/config/eslint")({ withPrettier: true });

/** @type {import('eslint').Linter.Config & {rules: import('eslint-plugin-functional-core/index').rules}} */
module.exports = {
  ...ecmConfig,
  root: true,
  rules: {
    ...ecmConfig.rules,
    "functional-core/purity": [
      "warn",
      {
        allowThrow: true,
      },
    ],
  },
  settings: {
    "functional-core": {
      purePaths: [".*"],
    },
  },
};
