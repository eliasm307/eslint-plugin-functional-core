import path from "path";
import rule from "../../../src/rules/purity";
import {
  createRuleTester,
  testCaseUniqueAndInPureFileByDefault,
} from "../../../src/utils.pure/tests";
import type { InvalidTestCase, ValidTestCase } from "../../../src/utils.pure/tests";

const validCases: ValidTestCase[] = [
  // constructor cases
  {
    name: "can mutate instance properties by assignment in constructor",
    code: `
      class Foo {
        constructor() {
          this.value = 0;
        }
      }
    `,
  },
  {
    name: "can mutate instance properties by object mutation in constructor",
    code: `
      class Foo {
        constructor() {
          this.prop.value = 0;
        }
      }
    `,
  },
  {
    name: "can mutate instance properties by incrementing using shorthand in constructor",
    code: `
      class Foo {
        constructor() {
          this.value++;
        }
      }
    `,
  },
  {
    name: "can mutate instance properties by incrementing in constructor",
    code: `
      class Foo {
        constructor() {
          this.value += 1;
        }
      }
    `,
  },
  {
    name: "can mutate instance properties by decrementing using shorthand in constructor",
    code: `
      class Foo {
        constructor() {
          this.value--;
        }
      }
    `,
  },
  {
    name: "can mutate instance properties by decrementing in constructor",
    code: `
      class Foo {
        constructor() {
          this.value -= 1;
        }
      }
    `,
  },

  // setter case (these are mutators by design so using an option)
  {
    name: "can mutate instance properties in class setter (with option)",
    code: `
      class Foo {
        set setter(v) {
          this.value = 0;
        }
      }
    `,
    options: [{ allowSetters: true }],
  },
  {
    name: "can return this from method",
    code: `
      class Foo {
        method() {
          return this;
        }
      }
    `,
  },
  {
    name: "can implicit return this from arrow function in method",
    code: `
      class Foo {
        method() {
          return () => this;
        }
      }
    `,
  },
  {
    name: "can explicit return this from arrow function in method",
    code: `
      class Foo {
        method() {
          return () => {
            return this;
          }
        }
      }
    `,
  },
  {
    name: "can mutate this in methods with option",
    code: `
      class Foo {
        method() {
          this.value = 0;
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: true }],
  },
  {
    name: "can mutate class this in arrow function inside methods with option",
    code: `
      class Foo {
        method() {
          return () => {
            this.value = 0;
          }
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: true }],
  },
  {
    name: "class references are considered immutable",
    code: `
      class Foo {}

      function bar() {
        return Foo;
      }
    `,
  },
];

const invalidCases: InvalidTestCase[] = [
  // constructor cases
  {
    name: "cannot mutate this properties in constructor child function declaration scope (without option)",
    code: `
      class Foo {
        constructor() {
          function x() {
            this.value -= 1;
          }
        }
      }
    `,
    errors: [
      { messageId: "cannotMutateThisContext" },
      { messageId: "cannotUseExternalMutableVariables" },
    ],
  },
  {
    name: "cannot mutate instance properties in constructor child arrow function scope (without option)",
    code: `
      class Foo {
        constructor() {
          const func = () => {
            this.value -= 1;
          }
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: false }],
    errors: [{ messageId: "cannotMutateThisContext" }],
  },

  // method cases
  {
    name: "cannot mutate instance properties by assignment in method (without option)",
    code: `
      class Foo {
        method() {
          this.value = 0;
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: false }],
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by object mutation in method (without option)",
    code: `
      class Foo {
        method() {
          this.prop.value = 0;
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: false }],
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by incrementing using shorthand in method (without option)",
    code: `
      class Foo {
        method() {
          this.value++;
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: false }],
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by incrementing in method (without option)",
    code: `
      class Foo {
        method() {
          this.value += 1;
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: false }],
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by decrementing using shorthand in method (without option)",
    code: `
      class Foo {
        method() {
          this.value--;
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: false }],
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by decrementing in method (without option)",
    code: `
      class Foo {
        method() {
          this.value -= 1;
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: false }],
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot return this from function declaration in method",
    code: `
      class Foo {
        method() {
          return function() {
            return this;
          }
        }
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },

  // getter cases
  {
    name: "cannot mutate instance properties by assignment in getter (without option)",
    code: `
      class Foo {
        get getter() {
          this.value = 0;
          return 1;
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: false }],
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by object mutation in getter (without option)",
    code: `
      class Foo {
        get getter() {
          this.prop.value = 0;
          return 1;
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: false }],
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by incrementing using shorthand in getter (without option)",
    code: `
      class Foo {
        get getter() {
          this.value++;
          return 1;
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: false }],
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by incrementing in getter (without option)",
    code: `
      class Foo {
        get getter() {
          this.value += 1;
          return 1;
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: false }],
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by decrementing using shorthand in getter (without option)",
    code: `
      class Foo {
        get getter() {
          this.value--;
          return 1;
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: false }],
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by decrementing in getter (without option)",
    code: `
      class Foo {
        get getter() {
          this.value -= 1;
          return 1;
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: false }],
    errors: [{ messageId: "cannotMutateThisContext" }],
  },

  // setter case
  {
    name: "cannot define class setter (without option)",
    code: `
      class Foo {
        set setter(v) {
          // code
        }
      }
    `,
    options: [{ allowSetters: false }],
    errors: [{ messageId: "cannotDefineSetters" }],
  },
  {
    name: "cannot mutate this in function declaration sub-scope inside methods with option",
    code: `
      class Foo {
        method() {
          function sub() {
            this.value = 0;
          }
        }
      }
    `,
    options: [{ allowClassInstanceThisMutations: true }],
    errors: [
      { messageId: "cannotMutateThisContext" },
      { messageId: "cannotUseExternalMutableVariables" },
    ],
  },
];

createRuleTester().run(`purity > ${path.basename(__filename, ".test.ts")}`, rule, {
  valid: validCases.map(testCaseUniqueAndInPureFileByDefault),
  invalid: invalidCases.map(testCaseUniqueAndInPureFileByDefault),
});
