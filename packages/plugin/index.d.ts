import type * as rulesImport from "./src/rules";
import type * as configsImport from "./src/configs";

export const rules: (typeof rulesImport)["default"];

export const configs: (typeof configsImport)["default"];
