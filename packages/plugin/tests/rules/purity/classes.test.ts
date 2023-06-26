import path from "path";
import rule from "../../../src/rules/purity";
import { createRuleTester, testCaseInPureFileByDefault } from "../../../src/utils.pure/tests";
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
];

const invalidCases: InvalidTestCase[] = [
  // constructor cases
  {
    name: "cannot mutate instance properties in constructor child function declaration scope",
    code: `
      class Foo {
        constructor() {
          function x() {
            this.value -= 1;
          }
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties in constructor child arrow function scope",
    code: `
      class Foo {
        constructor() {
          const func = () => {
            this.value -= 1;
          }
        }
      }
    `,
    // todo this should only be one error
    errors: [
      { messageId: "cannotMutateThisContext" },
      { messageId: "cannotUseExternalMutableVariables" },
    ],
  },

  // method cases
  {
    name: "cannot mutate instance properties by assignment in method",
    code: `
      class Foo {
        method() {
          this.value = 0;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by object mutation in method",
    code: `
      class Foo {
        method() {
          this.prop.value = 0;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by incrementing using shorthand in method",
    code: `
      class Foo {
        method() {
          this.value++;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by incrementing in method",
    code: `
      class Foo {
        method() {
          this.value += 1;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by decrementing using shorthand in method",
    code: `
      class Foo {
        method() {
          this.value--;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by decrementing in method",
    code: `
      class Foo {
        method() {
          this.value -= 1;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },

  // getter cases
  {
    name: "cannot mutate instance properties by assignment in getter",
    code: `
      class Foo {
        get getter() {
          this.value = 0;
          return this.value;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by object mutation in getter",
    code: `
      class Foo {
        get getter() {
          this.prop.value = 0;
          return this.value;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by incrementing using shorthand in getter",
    code: `
      class Foo {
        get getter() {
          this.value++;
          return this.value;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by incrementing in getter",
    code: `
      class Foo {
        get getter() {
          this.value += 1;
          return this.value;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by decrementing using shorthand in getter",
    code: `
      class Foo {
        get getter() {
          this.value--;
          return this.value;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by decrementing in getter",
    code: `
      class Foo {
        get getter() {
          this.value -= 1;
          return this.value;
        }
      }
    `,
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
    errors: [{ messageId: "cannotDefineSetters" }],
  },
];

createRuleTester().run(`purity > ${path.basename(__filename, ".test.ts")}`, rule, {
  valid: validCases.map(testCaseInPureFileByDefault),
  invalid: invalidCases.map(testCaseInPureFileByDefault),
});
