// @ts-check
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  collectCoverage: true,
  cache: true,
  verbose: true,
  collectCoverageFrom: ["./src/**/*.{js,jsx,ts,tsx}"],
  // coverageReporters: ["lcov"],
  moduleFileExtensions: ["ts", "tsx", "mts", "mtsx", "js", "jsx", "mjs", "mjsx", "json", "node"],
  testRegex: ["./tests/.+\\.test\\.ts$", "./tests/.+\\.spec\\.ts$"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2019",
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
      },
    ],
  },
  coveragePathIgnorePatterns: ["src/index.ts$", "src/configs/.*.ts$"],
};
