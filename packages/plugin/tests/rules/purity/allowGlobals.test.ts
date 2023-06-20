import rule from "../../../src/rules/purity";
import type { InvalidTestCase, ValidTestCase } from "../../../src/utils.pure/tests";
import { createRuleTester, testCaseInPureFileByDefault } from "../../../src/utils.pure/tests";

const validCases: ValidTestCase[] = [
  {
    name: "can use pure Math methods (with option)",
    code: `
      function func() {
        return Math.sqrt(4)
      }
    `,
    options: [
      {
        allowGlobals: {
          Math: {
            sqrt: true,
          },
        },
      },
    ],
  },
  {
    name: "can use pure globalThis.Math methods (with option)",
    code: `
      function func() {
        return globalThis.Math.sqrt(4)
      }
    `,
    options: [
      {
        allowGlobals: {
          Math: {
            sqrt: true,
          },
        },
      },
    ],
  },
  {
    name: "can use pure window.Math methods (with option)",
    code: `
      function func() {
        return window.Math.sqrt(4)
      }
    `,
    options: [
      {
        allowGlobals: {
          Math: {
            sqrt: true,
          },
        },
      },
    ],
  },
  {
    name: "can use console (with option flag)",
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
    options: [
      {
        allowGlobals: {
          console: true,
        },
      },
    ],
  },
  {
    name: "allows global keywords to be used as identifiers in other expressions",
    code: `const foo = {}.global.globalThis.window.random()`,
  },
];

const invalidCases: InvalidTestCase[] = [
  {
    name: "cannot use Math.random (without option flag)",
    code: `
    function impure() {
      return Math.random() * 100;
    }
    `,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot use window.Math.random (without option flag)",
    code: `
    function impure() {
      return window.Math.random() * 100;
    }
    `,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot use globalThis.Math.random (without option flag)",
    code: `
    function impure() {
      return globalThis.Math.random() * 100;
    }
    `,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot use global.Math.random (without option flag)",
    code: `
    function impure() {
      return global.Math.random() * 100;
    }
    `,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot use console (without option flag)",
    code: `
    function impure() {
      console.log("foo");
    }
    `,
    errors: [{ messageId: "cannotIgnoreFunctionCallResult" }, { messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot use window.console (without option flag)",
    code: `
    function impure() {
      window.console.log("foo");
    }
    `,
    errors: [{ messageId: "cannotIgnoreFunctionCallResult" }, { messageId: "cannotReferenceGlobalContext" }],
  },
];

createRuleTester().run("purity > cannotImportImpureModules", rule, {
  valid: validCases.map(testCaseInPureFileByDefault),
  invalid: invalidCases.map(testCaseInPureFileByDefault),
});
