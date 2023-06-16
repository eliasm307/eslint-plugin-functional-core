import { ESLintUtils } from "@typescript-eslint/utils";

import rule from "../../src/rules/purity";

import type { MessageIds, Options } from "../../src/rules/purity";

// todo account for computed properties
// todo account for object spread
// todo account for object destructuring
// todo account for array destructuring
// todo account for array spread
// todo account for function spread
// todo account for types of identifiers
// todo add option to disallow let and var, everything has to be const
// todo make strict config
// todo add builtin methods for Window, array, object, string, number

const ruleTester = new ESLintUtils.RuleTester({ parser: "@typescript-eslint/parser" });

const invalid: ESLintUtils.InvalidTestCase<MessageIds, Options>[] = [
  {
    name: "cannot modify properties of this",
    code: `
      function foo() {
        this.foo.x = 1;
      }
    `,
    errors: [{ messageId: "cannotModifyThisContext" }],
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
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
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
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
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
        x += 1;
      }
    `,
    errors: [{ messageId: "cannotModifyExternalVariables" }],
  },
  {
    name: "cannot increment mutable external primitive variables using shorthand",
    code: `
      let x = 1;
      function foo() {
        x++;
      }
    `,
    errors: [{ messageId: "cannotModifyExternalVariables" }],
  },
  {
    name: "cannot decrement mutable external primitive variables using shorthand",
    code: `
      let x = 1;
      function foo() {
        x--;
      }
    `,
    errors: [{ messageId: "cannotModifyExternalVariables" }],
  },
  {
    name: "cannot decrement mutable external primitive variables",
    code: `
      let x = 1;
      function foo() {
        x -= 1;
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
    name: "cannot explicit return external reference variables",
    code: `
      const x = {};
      function foo() {
        return x;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot implicit return external reference variables",
    code: `
      const x = {};
      const foo = () => x;
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
    name: "cannot use window.Math.random",
    code: `
    function impure() {
      return window.Math.random() * 100;
    }
    `,
    errors: [{ messageId: "cannotUseImpureFunctions" }],
  },
  {
    name: "cannot use console (without option flag)",
    code: `
    function impure() {
      console.log("foo");
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
    errors: [{ messageId: "cannotModifyThisContext" }],
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
    errors: [{ messageId: "cannotModifyThisContext" }],
  },
  {
    name: "cannot modify instance properties by incrementing using shorthand",
    code: `
      class Impure {
        impure() {
          this.value++;
        }
      }
    `,
    errors: [{ messageId: "cannotModifyThisContext" }],
  },
  {
    name: "cannot modify instance properties by incrementing",
    code: `
      class Impure {
        impure() {
          this.value += 1;
        }
      }
    `,
    errors: [{ messageId: "cannotModifyThisContext" }],
  },
  {
    name: "cannot modify instance properties by decrementing using shorthand",
    code: `
      class Impure {
        impure() {
          this.value--;
        }
      }
    `,
    errors: [{ messageId: "cannotModifyThisContext" }],
  },
  {
    name: "cannot modify instance properties by decrementing",
    code: `
      class Impure {
        impure() {
          this.value -= 1;
        }
      }
    `,
    errors: [{ messageId: "cannotModifyThisContext" }],
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
  {
    name: "cannot call functions and ignore the return value",
    code: `mod2Pure.func1()`,
    errors: [{ messageId: "cannotIgnoreFunctionCallReturnValue" }],
  },
  {
    name: "cannot spread external arrays",
    code: `
      const vals = [1, 2, 3];
      function update(val) {
          return [...vals, val];
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot spread external objects",
    code: `
      const vals = {a: 1, b: 2, c: 3};
      function update(val) {
          return {...vals, d: val};
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
    {
      name: "can import other pure modules",
      code: `import Bar, { foo } from "./foo.pure";`,
    },
    {
      name: "can use pure global functions",
      code: `
        function func() {
          const foo = structuredClone({a: 1});
        };
      `,
    },
    {
      name: "can use pure global functions from window",
      code: `
        function func() {
          const foo = window.structuredClone({a: 1});
        };
      `,
    },
    {
      name: "can throw errors (with option flag)",
      code: `
        function func(shouldBeThrown) {
          if (shouldBeThrown) {
            throw new Error('Impure exception');
          }
        }
    `,
      options: [{ allowThrow: true }],
    },
    {
      name: "can use console (with option flag)",
      code: `
        function func() {
          console.log("foo");
          console.warn("foo");
          console.error("foo");
          console.debug("foo");
          console.verbose("foo");
          console.table([]);
          console.dir([]);
        }
    `,
      options: [{ allowConsole: true }],
    },
    {
      name: "can use pure Math methods",
      code: `
        function impure() {
          return Math.sqrt(4);
        }
    `,
    },
    {
      name: "can use pure window.Math methods",
      code: `
        function impure() {
          return window.Math.sqrt(4)
        }
    `,
    },
    {
      name: "functions can explicit return arguments",
      code: `
        const foo2 = [].map((val) => {
          return val;
        });
      `,
    },
    {
      name: "functions can implicit return arguments",
      code: `const foo = [].map((val) => val);`,
    },
    {
      name: "can modify local arrays",
      code: `
        function update(val) {
            const vals = ["a", "b"];
            vals[vals.length] = val;
            return vals;
        }
      `,
    },
    {
      name: "can spread local arrays",
      code: `
        function update(val) {
            const vals = ["a", "b"];
            return [...vals, val];
        }
      `,
    },
    {
      name: "can spread local arrays from args",
      code: `
        function update(vals, val) {
            return [...vals, val];
        }
      `,
    },
    {
      name: "can use arguments without mutation",
      code: `
        function add(a,b) {
          return a + b
        }
      `,
    },
  ],
  invalid: invalid.map((c) => ({ ...c, filename: "file.pure.ts" })),
});
