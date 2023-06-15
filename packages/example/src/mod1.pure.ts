import "eslint"; // ❌

import mod1Impure from "./mod1"; // ❌
import mod2Pure from "./mod2.pure";

mod2Pure.func1(); // ❌

const val = mod2Pure.func1();

let x = 1;
const mutable = {};
function foo() {
  let y = x; // ❌
  x = 2; // ❌

  const m = {
    mutable, // ❌
  };

  const f = Math.random() > 0.5 ? mod1Impure : mod2Pure; // ❌

  [].forEach(() => {
    x = 3; // ❌
    y = 4; // ❌
    let z = x; // ❌
    z = 5;
  });
}
