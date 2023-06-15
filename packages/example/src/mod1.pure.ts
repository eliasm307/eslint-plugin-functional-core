import "eslint"; // ❌

import mod1Impure from "./mod1"; // ❌
import mod2Pure from "./mod2.pure";

let x = 1;

mod2Pure.func1(); // should error

const val = mod2Pure.func1();

const mutable = {};
function foo() {
  let y = x; // ❌
  x = 2; // ❌

  const m = {
    mutable, // ❌
  };

  [].forEach(() => {
    x = 3; // ❌
    y = 4; // ❌
    let z = x; // ❌
    z = 5;
  });
}
