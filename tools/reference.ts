// Independent test artifact only. Never imported by src/.
import { createHash } from "node:crypto";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";
import reference from "../reference.json" with { type: "json" };

const cache =
  process.env["PROPELLR_REFERENCE_CACHE"] ??
  join(homedir(), ".cache/propellr-reference/axe-core-4.13.0");
const project = await realpath(new URL("..", import.meta.url));
const external = (path: string) => {
  const location = relative(project, path);
  if (!isAbsolute(location) && location !== ".." && !location.startsWith(`..${sep}`))
    throw new Error("Reference cache must be outside this project");
};
external(resolve(cache));
await mkdir(cache, { recursive: true });
external(await realpath(cache));
const tarball = join(cache, "axe-core-4.13.0.tgz");
let bytes: Buffer;
try {
  bytes = await readFile(tarball);
} catch (error) {
  if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
  const response = await fetch(reference.primary.tarball);
  if (!response.ok) throw new Error(`Reference download failed: ${response.status}`);
  bytes = Buffer.from(await response.arrayBuffer());
}
const integrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
if (integrity !== reference.primary.integrity)
  throw new Error("Reference tarball integrity mismatch");
await writeFile(tarball, bytes);
// Extract only the published browser bundle and license; never install upstream tooling.
execFileSync("tar", [
  "-xzf",
  tarball,
  "-C",
  cache,
  "package/axe.min.js",
  "package/LICENSE",
  "package/package.json",
]);
const bundle = await readFile(join(cache, "package/axe.min.js"));
const sha256 = createHash("sha256").update(bundle).digest("hex");
if (reference.primary.bundleSha256 && sha256 !== reference.primary.bundleSha256)
  throw new Error("Reference bundle hash mismatch");
console.log(JSON.stringify({ cache, integrity, bundleSha256: sha256 }, null, 2));
