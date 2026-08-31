import { execFileSync } from "node:child_process";
import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const key = path.join(process.env.USERPROFILE, ".ssh", "wedfotobook_codex");
const server = "root@138.16.227.234";
const sshArgs = ["-i", key, "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", server];
const local = new Map();
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.(?:webp|avif|png|jpe?g|gif|svg|ico|woff2?|ttf|otf|eot)$/i.test(entry.name)) {
      local.set(path.relative(path.join(root, "public"), file).replaceAll("\\", "/"), (await stat(file)).size);
    }
  }
}
await walk(path.join(root, "public"));
const reports = {};
for (const directory of ["public", "dist/client"]) {
  const result = execFileSync("ssh", [...sshArgs, `find /root/WedPhotoBook_WebSite/${directory} -type f -printf '%P\t%s\n'`], { encoding: "utf8" });
  const remote = new Map(result.trim().split("\n").map((line) => {
    const index = line.lastIndexOf("\t");
    return [line.slice(0, index), Number(line.slice(index + 1))];
  }));
  const missing = [...local.keys()].filter((file) => !remote.has(file));
  const differentSize = [...local].filter(([file, size]) => remote.has(file) && remote.get(file) !== size)
    .map(([file, localSize]) => ({ file, localSize, remoteSize: remote.get(file) }));
  reports[directory] = { missing, differentSize };
}
const missing = [...new Set(Object.values(reports).flatMap((entry) => entry.missing))].sort();
const report = { localFiles: local.size, reports, missingBytes: missing.reduce((sum, file) => sum + local.get(file), 0) };
await writeFile(path.join(root, "tmp/restore-media/inventory.json"), JSON.stringify(report, null, 2));
await writeFile(path.join(root, "tmp/restore-media/missing-files.txt"), missing.join("\n") + "\n");
console.log(JSON.stringify(report, null, 2));
