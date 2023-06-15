import { spawn } from "child_process";
import fs from "fs";
import path from "path";

import packageJson from "../package.json";

/** In the order shown in the string ie [MAJOR].[MINOR].[PATCH] */
const UPDATE_TYPE_LEVELS = ["MAJOR", "MINOR", "PATCH"] as const;
type UpdateTypeName = (typeof UPDATE_TYPE_LEVELS)[number];
const args = process.argv.slice(2);

console.log("START: Publish script", args);

function assertPartsAreAllNumbers(parts: number[], version: string) {
  parts.forEach((part, i) => {
    if (isNaN(part)) {
      throw new Error(`Invalid version ${UPDATE_TYPE_LEVELS[i]} part ${part} in ${version}`);
    }
  });
}

function updateVersion(currentVersion: string, updateTypeName: UpdateTypeName): string {
  const updateTypeLevel = UPDATE_TYPE_LEVELS.indexOf(updateTypeName);
  console.log("updateVersion", currentVersion, updateTypeName, updateTypeLevel);

  const versionParts = currentVersion.split(".").map((v) => parseInt(v, 10));

  assertPartsAreAllNumbers(versionParts, currentVersion);

  versionParts[updateTypeLevel]++;
  const newVersion = versionParts.join(".");

  console.log("new version", newVersion);
  return newVersion;
}

async function run({ cmd, args, cwd }: { cmd: "npm" | "git"; args: string[]; cwd: string }) {
  return new Promise<void>((resolve, reject) => {
    // todo dont make this windows specific
    const baseCommand = cmd === "npm" ? "npm.cmd" : cmd;
    const spawnedProcess = spawn(baseCommand, args, { cwd });

    spawnedProcess.stdout.setEncoding("utf8");
    spawnedProcess.stdout.on("data", console.log);

    spawnedProcess.stderr.setEncoding("utf8");
    spawnedProcess.stderr.on("data", console.error);

    spawnedProcess.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
      resolve();
    });

    spawnedProcess.on("error", (err) => {
      console.error(`child process error ${err}`);
      reject(err);
    });
  });
}

async function main() {
  const updateTypeName = args[0].toUpperCase() as UpdateTypeName;
  const currentVersion = packageJson.version;
  const newVersion = updateVersion(currentVersion, updateTypeName);

  const newPackageJson = { ...packageJson, version: newVersion };
  const packageJsonPath = path.resolve(__dirname, "../package.json");
  const newPackageJsonString = JSON.stringify(newPackageJson, null, 2);
  fs.writeFileSync(packageJsonPath, newPackageJsonString);

  const rootDir = path.resolve(__dirname, "../../../");
  console.log("Publishing version", newVersion, "...");
  await run({ cmd: "npm", args: ["publish"], cwd: rootDir });
  console.log("✅ Published version", newVersion);

  console.log("Adding...");
  await run({ cmd: `git`, args: ["add", "."], cwd: rootDir });

  console.log("Committing...");
  await run({ cmd: `git`, args: ["commit", "-am", `Publish version ${newVersion}`], cwd: rootDir });

  console.log("Tagging...");
  await run({ cmd: `git`, args: ["tag", `v${newVersion}`], cwd: rootDir });

  console.log("Pushing...");
  await run({ cmd: `git`, args: ["push"], cwd: rootDir });

  console.log("Pushing tags...");
  await run({ cmd: `git`, args: ["push", "--tags"], cwd: rootDir });

  console.log("✅ Done");
}

main()
  .then(() => console.log("END: Publish script"))
  .catch((err) => {
    console.error("ERROR: Publish script", err);
    process.exit(1);
  });
