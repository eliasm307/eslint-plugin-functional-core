const ecmConfig = require("@eliasm307/config/eslint")({ withPrettier: true });

module.exports = {
  ...ecmConfig,
  rules: {
    ...ecmConfig.rules,
    "functional-core/purity": ["error", { allowThrow: true }],
  },
  root: true,
};
