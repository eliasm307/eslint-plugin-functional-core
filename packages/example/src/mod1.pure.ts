import "eslint"; // ❌

import mod1Impure from "./mod1"; // ❌
import mod2Pure from "./mod2.pure";

mod2Pure.func1(); // ❌

class Foo {
  bar = 1;
  constructor() {
    this.bar = 1;
  }

  method1() {
    this.bar = 2; // ❌ modifying this only allowed in constructor
  }
}

function f(param1: string) {
  return (param2: string) => `params: ${param1} ${param2}`;
}

const val = mod2Pure.func1();

let x = 1;
const mutable = {};
function foo() {
  let y = x; // ❌
  x = 2; // ❌

  const m = {
    mutable, // ❌
  };

  m.mutable = 3; // ok because it was defined in this context

  const f = Math.random() > 0.5 ? mod1Impure : mod2Pure; // ❌

  const foo = [].map((val) => val);

  const foo2 = [].map((val) => {
    return val;
  });

  const val = [{ foo: "", bar: "" }].reduce((out, val) => {
    out[val.foo] = val.bar; // this should be allowed via an option?
    return out;
  }, {} as Record<string, string>);

  const val2 = [].reduce((out, val) => {
    return out;
  }, {});

  const out = [1].map((val) => {
    x = 3; // ❌
    y = 4; // ❌
    let z = x; // ❌
    z = 5;
    return val;
  });
}
