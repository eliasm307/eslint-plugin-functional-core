 
var ecmConfig = require("@eliasm307/config/eslint")({ withPrettier: true, withReact: false });

module.exports = {
  root: true,
  plugins: ["@typescript-eslint", "functional-core"],
  env: {
    node: true,
  },
  // only one rule so we see just relevant issues
  rules: {
    "functional-core/purity": "warn", // so it doesn't cause failures
  },
  settings: ecmConfig.settings,
};
