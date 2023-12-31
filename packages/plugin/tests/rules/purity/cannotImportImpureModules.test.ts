import path from "path";
import rule from "../../../src/rules/purity";
import {
  createRuleTester,
  testCaseUniqueAndInPureFileByDefault,
} from "../../../src/utils.pure/tests";
import type { InvalidTestCase, ValidTestCase } from "../../../src/utils.pure/tests";

const validCases: ValidTestCase[] = [
  {
    name: "can import from other pure modules",
    code: `import Bar, { foo } from "./foo.pure";`,
  },
  {
    name: "can import types from impure modules",
    code: `
      import type Bar from "./foo";
      import type { foo } from "./foo";
    `,
  },
  {
    name: "can import impure absolute modules (with option)",
    code: `
      import { foo } from "foo";
      import foo from "foo";
    `,
    settings: {
      "functional-core": {
        purePaths: ["^foo$"],
      },
    },
  },
  {
    name: "can import impure relative modules (with option)",
    code: `
      import { foo } from "./dir/foo";
      import foo from "./dir/foo";
    `,
    settings: {
      "functional-core": {
        purePaths: ["\\/dir\\/"],
      },
    },
  },
  {
    name: "can relative import pure modules in a common pure folder",
    // the imports are also in the `common.pure` folder and so should be considered pure
    code: `
      import { bar } from "./bar";
      import bar from "./bar";
    `,
    filename: "/common.pure/foo.js",
  },
];

const invalidCases: InvalidTestCase[] = [
  {
    name: "cannot import impure relative modules by default import (without option)",
    code: `import foo from "./foo";`,
    errors: [{ messageId: "cannotImportImpureModules" }],
  },
  {
    name: "cannot import impure absolute modules by named import (without option)",
    code: `import { foo } from "foo";`,
    errors: [{ messageId: "cannotImportImpureModules" }],
  },
  {
    name: "cannot import impure absolute modules by default import (without option)",
    code: `import foo from "foo";`,
    errors: [{ messageId: "cannotImportImpureModules" }],
  },
  {
    name: "cannot import impure modules that partially match pattern",
    code: `import foo from "./tests/foo";`,
    settings: {
      "functional-core": {
        purePaths: "\\/test\\/", // also tests it accepts strings
      },
    },
    errors: [{ messageId: "cannotImportImpureModules" }],
  },
  {
    name: "cannot import impure relative modules by named import (without option)",
    code: `import { foo } from "./foo";`,
    errors: [{ messageId: "cannotImportImpureModules" }],
  },
  {
    name: "cannot relative default import impure modules from outside a pure folder",
    code: `import bar from "../bar";`,
    filename: "/common.pure/foo.js",
    errors: [{ messageId: "cannotImportImpureModules" }],
  },
  {
    name: "cannot relative named import impure modules from outside a pure folder",
    code: `import {bar} from "../bar";`,
    filename: "/common.pure/foo.js",
    errors: [{ messageId: "cannotImportImpureModules" }],
  },
];

createRuleTester().run(`purity > ${path.basename(__filename, ".test.ts")}`, rule, {
  valid: validCases.map(testCaseUniqueAndInPureFileByDefault),
  invalid: invalidCases.map(testCaseUniqueAndInPureFileByDefault),
});
