import { ESLintUtils } from "@typescript-eslint/utils";
import rule, { MessageIds, Options } from "../../src/rules/purity";

const ruleTester = new ESLintUtils.RuleTester({
  parser: "@typescript-eslint/parser",
});

const invalid: ESLintUtils.InvalidTestCase<MessageIds, Options>[] = [
  {
    name: "cannot modify properties of this",
    code: `
      function foo() {
        this.foo.x = 1;
      }
    `,
    errors: [{ messageId: "" }],
  },
  {
    name: "cannot use globalThis",
    code: `
      function foo() {
        globalThis.foo.x = 1;
      }
    `,
    errors: [{ messageId: "" }],
  },
  {
    name: "cannot use window",
    code: `
      function foo() {
        window.foo.x = 1;
      }
    `,
    errors: [{ messageId: "" }],
  },
  {
    name: "cannot use global variables",
    code: `
      function foo() {
        x = 1;
      }
    `,
    errors: [{ messageId: "" }],
  },
  {
    name: "cannot have side-effect imports",
    code: `
      import "side-effect";
    `,
    errors: [{ messageId: "" }],
  },
  {
    name: "cannot use mutable external primitive variables",
    code: `
      let x = 1;
      function foo() {
        x = 2;
      }
    `,
    errors: [{ messageId: "cannotModifyExternalVariables" }],
  },
  {
    name: "cannot mutate external reference variables",
    code: `
      const x = {};
      function foo() {
        x.a = 1;
      }
    `,
    errors: [{ messageId: "" }],
  },
  {
    name: "cannot use external reference variables",
    code: `
      const x = {};
      function foo() {
        return x;
      }
    `,
    errors: [{ messageId: "" }],
  },
];

ruleTester.run("purity", rule, {
  valid: [
    {
      name: "can use immutable external primitive variables",
      code: `
        const x = 1;
        function foo() {
          const y = x;
        }
      `,
    },
  ],
  invalid: invalid.map((c) => ({ ...c, filename: "file.pure.ts" })),
});
