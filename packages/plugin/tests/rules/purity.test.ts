import rule from "../../src/rules/purity";

import type { InvalidTestCase, ValidTestCase } from "../../src/utils.pure/tests";
import { createRuleTester, testCaseUniqueAndInPureFileByDefault } from "../../src/utils.pure/tests";

// todo account for TS types of identifiers
// todo add option to disallow let and var, everything has to be const

const validCases: ValidTestCase[] = [
  {
    name: "can use immutable external primitive variables",
    code: `
      const x = \`1\`;
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
    name: "can mutate internal reference variables using literal computed properties",
    code: `
      function foo(n) {
        const x = {};
        x["foo"] = 1;
      }
    `,
  },
  {
    name: "can mutate internal reference variables using computed properties",
    code: `
      function foo(n) {
        const x = {};
        x[n] = 1;
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
    name: "can use pure global namespace methods (with option)",
    code: `
      function method() {
        return SomeGlobal.methodA(4);
      }
    `,
    options: [{ allowGlobals: { SomeGlobal: { methodA: true } } }],
  },
  {
    name: "can use pure global namespace methods using literal computed property (with option)",
    code: `
      function method() {
        return SomeGlobal["methodA"](4);
      }
    `,
    options: [{ allowGlobals: { SomeGlobal: { methodA: true } } }],
  },
  {
    name: "can use global namespace methods using computed property if the entire namespace is pure (with option)",
    code: `
      function method(n) {
        return SomeGlobal[n](4);
      }
    `,
    options: [{ allowGlobals: { SomeGlobal: true } }],
  },
  {
    name: "can call global namespace if it is fully pure (with option)",
    code: `
      function method(n) {
        return SomeGlobal()
      }
    `,
    options: [{ allowGlobals: { SomeGlobal: true } }],
  },
  {
    name: "can call global namespace if it is partially pure (with option)",
    code: `
      function method(n) {
        return SomeGlobal()
      }
    `,
    options: [{ allowGlobals: { SomeGlobal: { "{{AsFunction}}": true } } }],
  },
  {
    name: "can call Date() with arguments if it is marked as globally pure",
    code: `
      function method(n) {
        return Date(n);
      }
    `,
    options: [{ allowGlobals: { Date: { "{{AsFunction}}": true } } }],
  },
  {
    name: "functions can explicit return parameters",
    code: `
      const foo2 = [].map((val) => {
        return val;
      });
    `,
  },
  {
    name: "functions can explicit return parent function parameters",
    code: `
      function foo(p) {
        return () => {
          return p;
        }
      }
    `,
  },
  {
    name: "functions can implicit return parameters",
    code: `const foo = [].map((val) => val);`,
  },
  {
    name: "functions can implicit return parent parameters",
    code: `
      function foo(p) {
        return () => p;
      }
    `,
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
    name: "can return const external reference variables",
    code: `
      const x = {};
      function foo() {
        return x;
      }
    `,
  },
  {
    name: "can use external const variables in if conditions",
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
    name: "can use external const variables in while conditions",
    code: `
      const x = 1;
      function foo() {
        while(x) {
          return 1;
        }
      }
    `,
  },
  {
    name: "can use external const variables in do while conditions",
    code: `
      const x = 1;
      function foo() {
        do {
          return 1;
        } while(x)
      }
    `,
  },
  {
    name: "can use external const variables in ternary conditions",
    code: `
      const x = 1;
      function foo() {
        return x ? 1 : 2;
      }
    `,
  },
  {
    name: "can use external const variables in switch statements",
    code: `
      const x = 1;
      function foo() {
        switch(x) {
          case 1:
            return 1;
          default:
            return 2;
        }
      }
    `,
  },
  {
    name: "can use external const variables in a switch case",
    code: `
      const x = 1;
      function foo() {
        switch(1) {
          case x:
            return 1;
          default:
            return 2;
        }
      }
    `,
  },
  {
    name: "can use external const destructured variables in conditions",
    code: `
      const y = {x: {}}
      const {x} = y;
      function foo() {
        if(x) {
          return 1;
        }
      }
    `,
  },
  {
    name: "can use external const destructured and renamed variables in conditions",
    code: `
      const y = {x: {}}
      const {x: bar} = y;
      function foo() {
        if(bar) {
          return 1;
        }
      }
    `,
  },
  {
    name: "can use external immutable reference const variables in logical expressions",
    code: `
      const x = {};
      const y = {};
      function foo() {
        if(x || y) {
          return 1;
        }
      }
    `,
  },
  {
    name: "can use external immutable reference const variables in 'and' return conditions",
    code: `
      const x = {};
      const y = {};
      function foo() {
        return x && y;
      }
    `,
  },
  {
    name: "can use external immutable reference const variables in truthy coalescing conditions",
    code: `
      const x = {};
      const y = {};
      function foo() {
        return x || y;
      }
    `,
  },
  {
    name: "can use external immutable reference const variables in nullish coalescing conditions",
    code: `
      const x = {};
      const y = {};
      function foo() {
        return x ?? y;
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
    name: "can call parameter methods using literal computed property",
    code: `
      function func(param) {
        return param["foo"]();
      }
    `,
  },
  {
    name: "can call parameter methods using computed property",
    code: `
      function func(param, key) {
        return param[key]();
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
    name: "can call external function references that are constant and declared",
    code: `
      const externalFunc = () => 1;
      function func() {
        return externalFunc();
      }
    `,
  },
  {
    name: "can call external function references that are constant and created from a higher order function",
    code: `
      function createExternalFunc() {
        return () => 1;
      }
      const externalFunc = createExternalFunc();
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
    name: "can use destructured and renamed object properties from function parameter",
    code: `
      function x({ val: bar }) {
        return bar;
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
  {
    name: "can use spread arguments",
    code: `
      function x(...args) {
        return (...args) => args;
      }
    `,
  },
  {
    name: "can define object setter (with option)",
    code: `
      const foo = {
        set setter(v) {
          // code
        }
      }
    `,
    options: [{ allowSetters: true }],
  },
  {
    name: "can have function without return with option",
    code: `
      function foo() {
        const x = 1;
      }
    `,
    options: [{ allowFunctionWithoutReturn: true }],
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
    errors: [
      { messageId: "cannotMutateThisContext" },
      { messageId: "cannotUseExternalMutableVariables" },
    ],
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
    name: "cannot use global this from arrow function",
    code: `
      const foo = () => {
        const x = this;
      }
    `,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot alias this in function declaration",
    code: `
      function foo() {
        const x = this;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
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
    name: "cannot mutate reference parameters using literal computed properties",
    code: `
      function impure(param) {
        param["x"] = 1;
      }
    `,
    errors: [{ messageId: "cannotMutateFunctionParameters" }],
  },
  {
    name: "cannot mutate reference parameters using computed properties",
    code: `
      function impure(param, n) {
        param[n] = 1;
      }
    `,
    errors: [{ messageId: "cannotMutateFunctionParameters" }],
  },
  {
    name: "cannot use external mutable const variable properties in chained conditions",
    code: `
      const x = {};
      const y = 1;
      function foo() {
        if(x.y || y) {
          return 1;
        }
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external mutable const variable properties in ternary conditions",
    code: `
      const x = {};
      function foo() {
        return x.flag ? 1 : 2;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external mutable const variable properties in switch case statements",
    code: `
      const x = {};
      function foo() {
        switch(x.code) {
          case 1:
            return 1;
          default:
            return 2;
        }
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external mutable let variables in if conditions",
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
    name: "cannot use external let variables in ternary conditions",
    code: `
      let x = 1;
      function foo() {
        return x ? 1 : 2;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external let variables in switch statements",
    code: `
      let x = 1;
      function foo() {
        switch(x) {
          case 1:
            return 1;
          default:
            return 2;
        }
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external let variables in switch case statements",
    code: `
      let x = 1;
      function foo() {
        switch(1) {
          case x:
            return 1;
          default:
            return 2;
        }
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external mutable let variables in while conditions",
    code: `
      let x = 1;
      function foo() {
        while(x) {
          return 1;
        }
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external mutable let variables in do while conditions",
    code: `
      let x = 1;
      function foo() {
        do {
          return 1;
        } while(x)
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external let destructured variables in conditions",
    code: `
      const y = {x: {}}
      let {x} = y;
      function foo() {
        if(x) {
          return 1;
        }
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external let destructured and renamed variables in conditions",
    code: `
      const y = {x: {}}
      let {x: bar} = y;
      function foo() {
        if(bar) {
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
      const y = 1;
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
    name: "cannot use external var destructured variables in conditions",
    code: `
      const y = {x: {}}
      var {x} = y;
      function foo() {
        if(x) {
          return 1;
        }
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external var destructured and renamed variables in conditions",
    code: `
      const y = {x: {}}
      var {x: bar} = y;
      function foo() {
        if(bar) {
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
    name: "cannot use impure global functions (without setting it as an allowed global)",
    code: `
      function method() {
        setTimeout(() => null, 1000);
      }
    `,
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
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
    options: [{ allowThrow: false }],
    errors: [{ messageId: "cannotThrowErrors" }],
  },
  {
    name: "cannot call functions and ignore the return value (without option)",
    code: `
    import mod2Pure from './mod2.pure';
    mod2Pure.func1()
    `,
    options: [{ allowIgnoreFunctionCallResult: false }],
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
      const ref = {
        externalFunc: () => null
      };

      function func() {
        return ref.externalFunc();
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot call functions from a mutable references using literal computed property",
    code: `
      const ref = {
        externalFunc: () => null
      };

      function func() {
        return ref["externalFunc"]();
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
    errors: [
      { messageId: "cannotMutateExternalVariables" },
      { messageId: "cannotUseExternalMutableVariables" },
    ],
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
    options: [{ allowMutatingReduceAccumulator: false }],
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
    options: [{ allowMutatingReduceAccumulator: false }],
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
  {
    name: "cannot use global namespace methods using computed property if the entire namespace is not fully pure (with option)",
    code: `
      function method(n) {
        return SomeGlobal[n](4);
      }
    `,
    options: [{ allowGlobals: { SomeGlobal: { sqrt: true } } }],
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot use global namespace methods using computed property if the entire namespace is not pure (with option)",
    code: `
      function method(n) {
        return SomeGlobal[n](4);
      }
    `,
    options: [{ allowGlobals: { SomeGlobal: false } }],
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot mutate global namespace even if it is pure (with option)",
    code: `
      function method(n) {
        SomeGlobal.newMethod = () => null;
      }
    `,
    options: [{ allowGlobals: { SomeGlobal: true } }],
    errors: [{ messageId: "cannotMutateExternalVariables" }],
  },
  {
    name: "cannot call global namespace (without option)",
    code: `
      function method(n) {
        return SomeGlobal()
      }
    `,
    options: [{ allowGlobals: { SomeGlobal: { foo: true } } }],
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot call Date() with arguments if it is not marked as globally pure",
    code: `
      function method(n) {
        return Date(n);
      }
    `,
    options: [{ allowGlobals: { Date: { parse: true } } }],
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot call Date() without arguments even if it is marked as globally pure",
    code: `
      function method(n) {
        return Date();
      }
    `,
    options: [{ allowGlobals: { Date: { "{{AsFunction}}": true } } }],
    errors: [{ messageId: "cannotReferenceGlobalContext" }],
  },
  {
    name: "cannot call methods of external reference variable",
    code: `
      const context = {
        getText: () => null
      };
      function getNodeText(node) {
        return context.getText(node);
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot define object setter (without option)",
    code: `
      const foo = {
        set setter(v) {
          // code
        }
      }
    `,
    options: [{ allowSetters: false }],
    errors: [{ messageId: "cannotDefineSetters" }],
  },
  {
    name: "cannot return external const reference variable properties",
    code: `
      var x = {};
      function foo() {
        return x.value;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot return mutable let external reference variables",
    code: `
      var x = {};
      function foo() {
        return x;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot return mutable var external reference variables",
    code: `
      var x = {};
      function foo() {
        return x;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external immutable reference let variables in 'and' return conditions",
    code: `
      let x = {};
      const y = {};
      function foo() {
        return x && y;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external immutable reference let variables in truthy coalescing conditions",
    code: `
      let x = {};
      const y = {};
      function foo() {
        return x || y;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external immutable reference let variables in nullish coalescing conditions",
    code: `
      let x = {};
      const y = {};
      function foo() {
        return x ?? y;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external immutable reference var variables in 'and' return conditions",
    code: `
      var x = {};
      const y = {};
      function foo() {
        return x && y;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external immutable reference var variables in truthy coalescing conditions",
    code: `
      var x = {};
      const y = {};
      function foo() {
        return x || y;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external immutable reference var variables in nullish coalescing conditions",
    code: `
      var x = {};
      const y = {};
      function foo() {
        return x ?? y;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external mutable const variable properties in 'and' return conditions",
    code: `
      const x = {};
      const y = {};
      function foo() {
        return x.flag && y;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external mutable const variable properties in truthy coalescing conditions",
    code: `
      const x = {};
      const y = {};
      function foo() {
        return x.flag || y;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot use external mutable const variable properties in nullish coalescing conditions",
    code: `
      const x = {};
      const y = {};
      function foo() {
        return x.flag ?? y;
      }
    `,
    errors: [{ messageId: "cannotUseExternalMutableVariables" }],
  },
  {
    name: "cannot have function without return (without option)",
    code: `
      function foo() {
        const x = 1;
      }
    `,
    options: [{ allowFunctionWithoutReturn: false }],
    errors: [{ messageId: "functionsMustExplicitlyReturnAValue" }],
  },
];

createRuleTester().run("purity", rule, {
  valid: validCases.map(testCaseUniqueAndInPureFileByDefault),
  invalid: invalidCases.map(testCaseUniqueAndInPureFileByDefault),
});
