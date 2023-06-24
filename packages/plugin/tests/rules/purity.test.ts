import rule from "../../src/rules/purity";

import type { InvalidTestCase, ValidTestCase } from "../../src/utils.pure/tests";
import { createRuleTester, testCaseInPureFileByDefault } from "../../src/utils.pure/tests";

// todo account for computed properties
// todo account for object spread
// todo account for object destructuring
// todo account for array destructuring
// todo account for array spread
// todo account for function spread
// todo account for types of identifiers
// todo add option to disallow let and var, everything has to be const
// todo make strict config
// todo add tests for builtin methods for Window, Array, Object, String, Number, Symbol, Math, Date, RegExp, process, console, Set, Map, WeakSet, WeakMap, JSON, Promise,

const validCases: ValidTestCase[] = [
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
    name: "can use immutable external primitive variables as properties",
    code: `
      const x = 1;
      function foo() {
        const y = {x};
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
    name: "can use pure Math methods (with option)",
    code: `
      function method() {
        return Math.sqrt(4);
      }
    `,
    options: [{ allowGlobals: { Math: { sqrt: true } } }],
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
    name: "can mutate arrays defined in same scope",
    code: `
      function update(val) {
          const vals = ["a", "b"];
          vals[vals.length] = val;
          return vals;
      }
    `,
  },
  {
    name: "can spread arrays defined in same scope",
    code: `
      function update(val) {
          const vals = ["a", "b"];
          return [...vals, val];
      }
    `,
  },
  {
    name: "can spread arrays from parameters",
    code: `
      function update(vals, val) {
          return [...vals, val];
      }
    `,
  },
  {
    name: "can spread objects defined in same scope",
    code: `
      function update(val) {
          const vals = {a: 1, b: 2};
          return {...vals, val};
      }
    `,
  },
  {
    name: "can spread objects from parameters",
    code: `
      function update(vals, val) {
          return {...vals, val};
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
  {
    name: "can destructure arguments",
    code: `function add({a,b}) {}`,
  },
  {
    name: "can destructure arguments with custom names",
    code: `function add({a: c, b: d}) {}`,
  },
  {
    name: "can destructure arguments with default values",
    code: `function add({a = 1, b = 2}) {}`,
  },
  {
    name: "can destructure arguments with default values and custom names",
    code: `function add({a: c = 1, b: d = 2}) {}`,
  },
  {
    name: "can destructure arguments with default values and custom names inside function body",
    code: `
      function add(props) {
        const {a: c = 1, b: d = 2} = props;
      }
    `,
  },
  {
    name: "can re-assign arguments",
    code: `
      function getParent(node) {
        while(node.parentNode) {
          node = node.parentNode;
        }
        return node;
      }
    `,
  },
  {
    name: "can increment/decrement arguments directly (assuming they are passed in by value)",
    code: `
      function calculate(a) {
        a++;
        a--;
        a =+ 1;
        a =- 1;
        a = 1
        return a
      }
    `,
  },
  {
    name: "can use recursion",
    code: `
      function factorial(n) {
        if (n === 0) {
          return 1;
        }
        return n * factorial(n - 1);
      }
    `,
  },
  {
    name: "can call functions and ignore the return value (with option flag)",
    code: `
      import mod2Pure from './mod2.pure';
      mod2Pure.func1()
    `,
    options: [{ allowIgnoreFunctionCallResult: true }],
  },
  {
    name: "can use external const variables in conditions",
    code: `
      const x = 1;
      function foo() {
        if(x) {
          return 1;
        }
      }
    `,
  },
  {
    name: "can call imported functions",
    code: `
      import externalFunc from "./mod.pure";

      function func() {
        return externalFunc();
      }
    `,
  },
  {
    name: "can call constant arrow function references",
    code: `
      const externalFunc = () => 1;

      function func() {
        return externalFunc();
      }
    `,
  },
  {
    name: "can call constant function expression",
    code: `
      const externalFunc = function() {
        return 1;
      };

      function func() {
        return externalFunc();
      }
    `,
  },
  {
    name: "can call constant function declaration references",
    code: `
      function externalFunc() {
        return 1;
      }

      function func() {
        return externalFunc();
      }
    `,
  },
  {
    name: "can call parameters",
    code: `
      function func(externalFunc) {
        return externalFunc();
      }
    `,
  },
  {
    name: "can call parameter methods",
    code: `
      function func(param) {
        return param.method();
      }
    `,
  },
  {
    name: "can mutate array literal accumulator in reduce (with option)",
    code: `
      function func() {
        return [1,2,3].reduce((acc, val) => {
          acc[val] = val;
          return acc;
        }, {});
      }
    `,
    options: [{ allowMutatingReduceAccumulator: true }],
  },
  {
    name: "can mutate array variable accumulator in reduce (with option)",
    code: `
      function func() {
        const arr = [1,2,3];
        return arr.reduce((acc, val) => {
          acc[val] = val;
          return acc;
        }, {});
      }
    `,
    options: [{ allowMutatingReduceAccumulator: true }],
  },
  // todo support types
  // {
  //   name: "can mutate explicitly typed array variable accumulator in reduce (with option)",
  //   code: `
  //     function func(arr: number[]) {
  //       return arr.reduce((acc, val) => {
  //         acc[val] = val;
  //         return acc;
  //       }, {});
  //     }
  //   `,
  //   options: [{ allowMutatingReduceAccumulator: true }],
  // },
  {
    name: "can call external function references that are constant",
    code: `
      const externalFunc = () => 1;
      function func() {
        return externalFunc();
      }
    `,
  },
  {
    name: "can use destructured object properties from function parameter",
    code: `
      function x({ val }) {
        return val;
      }
    `,
  },
  {
    name: "can use destructured object properties from function parameter in a child function",
    code: `
      function x({ val }) {
        return () => val;
      }
    `,
  },
  {
    name: "can use deep destructured object properties from function parameter",
    code: `
      function x({ obj: { val } }) {
        return () => val;
      }
    `,
  },
  {
    name: "can use destructured array elements from function parameter",
    code: `
      function x([val]) {
        return () => val;
      }
    `,
  },
  {
    name: "can use fixed native global values",
    code: `
      function x(key) {
        switch(key) {
          case "Infinity":
            return Infinity;

          case "NaN":
            return NaN;

          case "undefined":
            return undefined;

          case "null":
            return null;
        }
      }
    `,
  },
];

const invalidCases: InvalidTestCase[] = [
  {
    name: "cannot mutate properties of this",
    code: `
      function foo() {
        this.foo.x = 1;
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate globalThis",
    code: `
      function foo() {
        globalThis.foo.x = 1;
      }
    `,
    errors: [
      { messageId: "cannotMutateExternalVariables" },
      { messageId: "cannotReferenceGlobalContext" },
    ],
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
    name: "cannot mutate global window",
    code: `
      function foo() {
        window.foo.x = 1;
      }
    `,
    errors: [
      { messageId: "cannotMutateExternalVariables" },
      { messageId: "cannotReferenceGlobalContext" },
    ],
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
    name: "cannot use global this",
    code: `
      const foo = () => {
        const x = this;
      }
    `,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot mutate global variables",
    code: `
      function foo() {
        x = 1;
      }
    `,
    errors: [{ messageId: "cannotMutateExternalVariables" }],
  },
  {
    name: "cannot have side-effect imports",
    code: `import "side-effect";`,
    errors: [{ messageId: "moduleCannotHaveSideEffectImports" }],
  },
  {
    name: "cannot mutate mutable external primitive variables",
    code: `
      let x = 1;
      function foo() {
        x = 2;
      }
    `,
    errors: [{ messageId: "cannotMutateExternalVariables" }],
  },
  {
    name: "cannot increment mutable external primitive variables",
    code: `
      let x = 1;
      function foo() {
        x += 1;
      }
    `,
    errors: [{ messageId: "cannotMutateExternalVariables" }],
  },
  {
    name: "cannot increment mutable external primitive variables using shorthand",
    code: `
      let x = 1;
      function foo() {
        x++;
      }
    `,
    errors: [{ messageId: "cannotMutateExternalVariables" }],
  },
  {
    name: "cannot decrement mutable external primitive variables using shorthand",
    code: `
      let x = 1;
      function foo() {
        x--;
      }
    `,
    errors: [{ messageId: "cannotMutateExternalVariables" }],
  },
  {
    name: "cannot decrement mutable external primitive variables",
    code: `
      let x = 1;
      function foo() {
        x -= 1;
      }
    `,
    errors: [{ messageId: "cannotMutateExternalVariables" }],
  },
  {
    name: "cannot mutate external reference variables",
    code: `
      const x = {};
      function foo() {
        x.a = 1;
      }
    `,
    // ? should these be separate errors?
    errors: [
      { messageId: "cannotMutateExternalVariables" },
      { messageId: "cannotUseExternalMutableVariables" },
    ],
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
    name: "cannot mutate reference parameters",
    code: `
      function impure(param) {
        param.x = 1;
      }
    `,
    errors: [{ messageId: "cannotMutateFunctionParameters" }],
  },
  {
    name: "cannot use external mutable let variables in single conditions",
    code: `
      let x = 1;
      function foo() {
        if(x) {
          return 1;
        }
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external mutable let variables in chained conditions",
    code: `
      let x = {};
      const y = 1
      function foo() {
        if(x.y || y) {
          return 1;
        }
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external mutable var variables in conditions",
    code: `
      var x = 1;
      function foo() {
        if(x) {
          return 1;
        }
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
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
      function method() {
        setTimeout(() => null, 1000);
      }
    `,
    errors: [
      { messageId: "cannotIgnoreFunctionCallResult" },
      { messageId: "cannotReferenceGlobalContext" },
    ],
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
    options: [{ allowGlobals: { Error: true } }],
    errors: [{ messageId: "cannotThrowErrors" }],
  },
  {
    name: "cannot mutate instance properties by assignment",
    code: `
      class Foo {
        constructor() {
          this.value = 0;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by object mutation",
    code: `
      class Foo {
        constructor() {
          this.prop.value = 0;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot mutate instance properties by incrementing using shorthand",
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
    name: "cannot mutate instance properties by incrementing",
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
    name: "cannot mutate instance properties by decrementing using shorthand",
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
    name: "cannot mutate instance properties by decrementing",
    code: `
      class Foo {
        method() {
          this.value -= 1;
        }
      }
    `,
    errors: [{ messageId: "cannotMutateThisContext" }],
  },
  {
    name: "cannot call functions and ignore the return value",
    code: `
    import mod2Pure from './mod2.pure';
    mod2Pure.func1()
    `,
    errors: [{ messageId: "cannotIgnoreFunctionCallResult" }],
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
  {
    name: "can recognise global method usage when chained with property access",
    code: `const assert = globalRequire("chai").assert`,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "arrow functions cannot use 'this' for return value",
    code: `
      function func() {
        return () => this.someCondition();
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "arrow functions cannot use 'this' in logic",
    code: `
      function func() {
        return () => {
          if (this.someCondition()) {
            return 1;
          }
        };
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot call mutable function references",
    code: `
      let mutableFunc = () => null;

      function func() {
        return mutableFunc();
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot call mutable function declaration",
    code: `
      let externalFunc = function() {
        return 1;
      };

      function func() {
        return externalFunc();
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot call functions from a mutable references",
    code: `
      let externalFunc = () => null;

      const ref = {
        externalFunc,
      };

      function func() {
        return ref.externalFunc();
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot assign to const arrow function",
    code: `
      const externalFunc = () => null;

      function func() {
        externalFunc.assign = 1;
      }
    `,
    errors: [{ messageId: "cannotMutateExternalVariables" }],
  },
  {
    name: "cannot assign to const function expression",
    code: `
      const externalFunc = function() {
        return null;
      };

      function func() {
        externalFunc.assign = 1;
      }
    `,
    errors: [
      { messageId: "cannotMutateExternalVariables" },
      { messageId: "cannotUseExternalMutableVariables" },
    ],
  },
  {
    name: "cannot mutate array literal accumulator in reduce (without option)",
    code: `
      function func() {
        return [1,2,3].reduce((acc, val, i) => {
          acc[i] = val ;
          return acc;
        }, {});
      }
    `,
    errors: [{ messageId: "cannotMutateFunctionParameters" }],
  },
  {
    name: "can mutate array variable accumulator in reduce (without option)",
    code: `
      function func() {
        const arr = [1,2,3];
        return arr.reduce((acc, val) => {
          acc[val] = val;
          return acc;
        }, {});
      }
    `,
    errors: [{ messageId: "cannotMutateFunctionParameters" }],
  },
  // todo support typescript
  // {
  //   name: "cannot mutate explicitly typed array variable accumulator in reduce (without option)",
  //   code: `
  //     function func(arr: number[]) {
  //       return arr.reduce((acc, val) => {
  //         acc[val] = val;
  //         return acc;
  //       }, {});
  //     }
  //   `,
  //   errors: [{ messageId: "cannotMutateFunctionParameters" }],
  // },
  {
    name: "cannot call external let function references",
    code: `
      let externalFunc = () => 1;
      function func() {
        return externalFunc();
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot call external var function references",
    code: `
      var externalFunc = () => 1;
      function func() {
        return externalFunc();
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
];

createRuleTester().run("purity", rule, {
  valid: validCases.map(testCaseInPureFileByDefault),
  invalid: invalidCases.map(testCaseInPureFileByDefault),
});
