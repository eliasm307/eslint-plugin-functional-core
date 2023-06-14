import "eslint";

let x = 1;

const mutable = {};
function foo() {
  let y = x;
  x = 2;

  const m = {
    mutable, // sh
  };

  [].forEach(() => {
    x = 3;
    y = 4;
    let z = x;
    z = 5;
  });
}
