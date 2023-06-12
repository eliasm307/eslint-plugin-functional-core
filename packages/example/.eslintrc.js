"use strict";

module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  // extends: ["plugin:functional-core/recommended"],
  plugins: ["functional-core"],
  env: {
    node: true,
  },
  rules: {
    "functional-core/purity": "error",
  },
};
