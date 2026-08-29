import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const configPath = resolve(process.argv[2] ?? "");
const expectedDirectory = resolve("dist/server");
if (dirname(configPath) !== expectedDirectory || basename(configPath) !== "wrangler.json") {
  throw new Error("Expected the generated dist/server/wrangler.json config");
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
if (!config.assets?.directory) throw new Error("The generated runtime has no static assets directory");
config.assets.binding = "ASSETS";

const temporaryPath = `${configPath}.${process.pid}.tmp`;
writeFileSync(temporaryPath, `${JSON.stringify(config)}\n`, { encoding: "utf8", mode: 0o600 });
renameSync(temporaryPath, configPath);
