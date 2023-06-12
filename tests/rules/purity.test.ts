import { ESLintUtils } from "@typescript-eslint/utils";
import rule, { MessageIds, Options } from "../../src/rules/purity";

// todo account for computed properties
// todo account for object spread
// todo account for object destructuring
// todo account for array destructuring
// todo account for array spread
// todo account for function spread
// todo account for types of identifiers

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
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot modify globalThis",
    code: `
      function foo() {
        globalThis.foo.x = 1;
      }
    `,
    errors: [{ messageId: "cannotModifyExternalVariables" }, { messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot use globalThis",
    code: `
      function foo() {
        const x = globalThis;
      }
    `,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot modify global window",
    code: `
      function foo() {
        window.foo.x = 1;
      }
    `,
    errors: [{ messageId: "cannotModifyExternalVariables" }, { messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot use global window",
    code: `
      function foo() {
        const x = window;
      }
    `,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot modify global variables",
    code: `
      function foo() {
        x = 1;
      }
    `,
    errors: [{ messageId: "cannotModifyExternalVariables" }],
  },
  {
    name: "cannot have side-effect imports",
    code: `
      import "side-effect";
    `,
    errors: [{ messageId: "moduleCannotHaveSideEffectImports" }],
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
    errors: [{ messageId: "cannotModifyExternalVariables" }],
  },
  {
    name: "cannot return external reference variables",
    code: `
      const x = {};
      function foo() {
        return x;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
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
    {
      name: "can mutate internal reference variables",
      code: `
      function foo() {
        const x = {};
        x.a = 1;
      }
    `,
    },
  ],
  invalid: invalid.map((c) => ({ ...c, filename: "file.pure.ts" })),
});
