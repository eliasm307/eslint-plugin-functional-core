const prettier = require("prettier");
const prettierConfig = require("../../prettier.config");

/** @type {import('eslint-doc-generator').GenerateOptions} */
const config = {
  // initRuleDocs: true,
  urlRuleDoc(name, page) {
    if (page === "README.md") {
      // Use URLs only in the readme.
      return `https://github.com/eliasm307/eslint-plugin-functional-core/blob/main/packages/plugin/docs/rules/${name}.md`;
    }
  },
  postprocess: (content, path) =>
    prettier.format(content, { ...prettierConfig, parser: "markdown" }),
};

module.exports = config;
