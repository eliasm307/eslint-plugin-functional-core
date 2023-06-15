"use strict";

module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  plugins: ["functional-core"],
  env: {
    node: true,
  },
  // only one rule so we see just relevant issues
  rules: {
    "functional-core/purity": "warn", // so it doesn't cause failures
  },
};
