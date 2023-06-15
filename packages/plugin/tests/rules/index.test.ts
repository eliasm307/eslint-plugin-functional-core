import fs from "fs";
import rules from "../../src/rules";

describe("./src/rules/index.ts", () => {
  it("imports all available rule modules", () => {
    const ruleNames = Object.keys(rules).map((name) => `${name}.ts`);
    const files = fs
      .readdirSync("./src/rules")
      .filter((file) => file !== "index.ts" && file.endsWith(".ts"));

    expect(ruleNames).toEqual(expect.arrayContaining(files));
  });
});
