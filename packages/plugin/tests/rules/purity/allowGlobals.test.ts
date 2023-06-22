import rule from "../../../src/rules/purity";
import type { InvalidTestCase, ValidTestCase } from "../../../src/utils.pure/tests";
import { createRuleTester, testCaseInPureFileByDefault } from "../../../src/utils.pure/tests";

const validCases: ValidTestCase[] = [
  {
    name: "can use pure global functions directly (by default)",
    code: `
      function func() {
        return Boolean(4)
      }
    `,
  },
  {
    name: "can use pure global methods directly (by default)",
    code: `
      function func() {
        return Math.sqrt(4)
      }
    `,
  },
  {
    name: "can use pure global methods from 'globalThis' (by default)",
    code: `
      function func() {
        return globalThis.Math.sqrt(4)
      }
    `,
  },
  {
    name: "can use pure global methods from 'window' (by default)",
    code: `
      function func() {
        return window.Math.sqrt(4)
      }
    `,
  },
  {
    name: "can use console (by default)",
    code: `
      function func() {
        console.log("foo");
        console.warn("foo");
        console.error("foo");
        global.console.debug("foo");
        window.console.verbose("foo");
        globalThis.console.table([]);
        console.dir([]);
      }
    `,
  },
  {
    name: "allows global keywords to be used as identifiers in other expressions",
    code: `const foo = {}.global.globalThis.window.random()`,
  },
  {
    name: "allows directly using global reference with option",
    code: `
      this;
      globalThis;
      global;
      window;
    `,
    options: [{ allowGlobals: true }],
  },
  {
    name: "allows assigning to module.exports directly by default",
    code: `module.exports = {};`,
  },
  {
    name: "allows assigning to module.exports indirectly by default",
    code: `module.exports.foo = {};`,
  },
];

const invalidCases: InvalidTestCase[] = [
  {
    name: "cannot use impure global functions directly (without option flag)",
    code: `const timer = setTimeout(() => {}, 100)`,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot use impure global method directly (without option flag)",
    code: `
    function impure() {
      return Math.random() * 100;
    }
    `,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot use impure global method from 'window' (without option flag)",
    code: `
    function impure() {
      return window.Math.random() * 100;
    }
    `,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot use impure global method from 'globalThis' (without option flag)",
    code: `
    function impure() {
      return globalThis.Math.random() * 100;
    }
    `,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot use impure global method from 'global' (without option flag)",
    code: `
    function impure() {
      return global.Math.random() * 100;
    }
    `,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot use pure global methods directly (with option)",
    code: `
      function func() {
        return Math.sqrt(4)
      }
    `,
    options: [
      {
        allowGlobals: {
          Math: {
            sqrt: false,
          },
        },
      },
    ],
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
];

createRuleTester().run("purity > allowGlobals", rule, {
  valid: validCases.map(testCaseInPureFileByDefault),
  invalid: invalidCases.map(testCaseInPureFileByDefault),
});
