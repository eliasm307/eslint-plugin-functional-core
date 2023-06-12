import "eslint";

let x = 1;
function foo() {
  let y = x;
  x = 2;

  [].forEach(() => {
    x = 3;
    y = 4;
    let z = x;
    z = 5;
  });
}
