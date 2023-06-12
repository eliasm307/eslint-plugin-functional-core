"use strict";

module.exports = {
  root: true,
  sourceType: "module",
  extends: ["eslint:recommended", "plugin:eslint-plugin/recommended", "plugin:node/recommended"],
  env: {
    node: true,
  },
  overrides: [
    {
      files: ["tests/**/*.js"],
      env: { mocha: true },
    },
  ],
};
