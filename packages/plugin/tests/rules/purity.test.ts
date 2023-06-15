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
    name: "cannot modify mutable external primitive variables",
    code: `
      let x = 1;
      function foo() {
        x = 2;
      }
    `,
    errors: [{ messageId: "cannotModifyExternalVariables" }],
  },
  {
    name: "cannot increment mutable external primitive variables",
    code: `
      let x = 1;
      function foo() {
        x++;
      }
    `,
    errors: [{ messageId: "cannotModifyExternalVariables" }],
  },
  {
    name: "cannot decrement mutable external primitive variables",
    code: `
      let x = 1;
      function foo() {
        x--;
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
  {
    name: "cannot modify reference parameters",
    code: `
      function impure(param) {
        param.x = 1;
      }
    `,
    errors: [{ messageId: "cannotModifyExternalVariables" }],
  },
  {
    name: "cannot use external reference variables",
    code: `
      const x = {};
      function foo() {
        const y = x;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external reference variables indirectly",
    code: `
      const x = {};
      function foo() {
        const y = {x};
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external reference variables via spread",
    code: `
      const x = {};
      function foo() {
        const y = {...x};
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use impure global functions",
    code: `
      function impure() {
        setTimeout(() => console.log('Impure!'), 1000);
      }
    `,
    errors: [{ messageId: "cannotUseImpureFunctions" }],
  },
  {
    name: "cannot throw errors (without option flag)",
    code: `
      function impure(shouldBeThrown) {
        if (shouldBeThrown) {
          throw new Error('Impure exception');
        }
      }
    `,
    errors: [{ messageId: "cannotThrowErrors" }],
  },
  {
    name: "cannot use Math.random",
    code: `
    function impure() {
      return Math.random() * 100;
    }
    `,
    errors: [{ messageId: "cannotUseImpureFunctions" }],
  },
  {
    name: "cannot use console (without option flag)",
    code: `
    function impure() {
      return Math.random() * 100;
    }
    `,
    errors: [{ messageId: "cannotUseImpureFunctions" }],
  },
  {
    name: "cannot modify instance properties by assignment",
    code: `
      class Impure {
        constructor() {
          this.value = 0;
        }
      }
    `,
    errors: [{ messageId: "cannotModifyContext" }],
  },
  {
    name: "cannot modify instance properties by object mutation",
    code: `
      class Impure {
        constructor() {
          this.prop.value = 0;
        }
      }
    `,
    errors: [{ messageId: "cannotModifyContext" }],
  },
  {
    name: "cannot modify instance properties by incrementing",
    code: `
      class Impure {
        impure() {
          this.value++;
        }
      }
    `,
    errors: [{ messageId: "cannotModifyContext" }],
  },
  {
    name: "cannot modify instance properties by decrementing",
    code: `
      class Impure {
        impure() {
          this.value++;
        }
      }
    `,
    errors: [{ messageId: "cannotModifyContext" }],
  },
  {
    name: "cannot import impure modules by named import (without option)",
    code: `import { foo } from "./foo";`,
    errors: [{ messageId: "cannotImportImpureModules" }],
  },
  {
    name: "cannot import impure modules by default import (without option)",
    code: `import foo from "./foo";`,
    errors: [{ messageId: "cannotImportImpureModules" }],
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
    {
      name: "can import other pure modules",
      code: `import Bar, { foo } from "./foo.pure";`,
    },
    {
      name: "can import impure modules with option",
      code: `import Bar, {foo} from "./foo";`,
      // options: [{ allowImpureImports: true }],
    },
    {
      name: "can use pure global functions",
      code: `
        function pure() {
          const foo = structuredClone({a: 1});
        };
      `,
    },
    {
      name: "can throw errors (with option flag)",
      code: `
      function impure(shouldBeThrown) {
        if (shouldBeThrown) {
          throw new Error('Impure exception');
        }
      }
    `,
      options: [{ allowThrow: true }],
    },
  ],
  invalid: invalid.map((c) => ({ ...c, filename: "file.pure.ts" })),
});