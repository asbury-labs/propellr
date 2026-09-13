// Independent test artifact only. Never imported by src/.
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, realpath, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";
import reference from "../reference.json" with { type: "json" };

// Existing cache files are immutable. Never follow entry symlinks or open special files.
async function readCached(path: string): Promise<Buffer | undefined> {
  const file = await open(
    path,
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
  ).catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  });
  if (!file) return undefined;
  try {
    if (!(await file.stat()).isFile())
      throw new Error("Reference cache entry is not a regular file");
    return await file.readFile();
  } finally {
    await file.close();
  }
}

const executionDirectory = process.cwd();
const requestedCache = resolve(
  process.env["PROPELLR_REFERENCE_CACHE"] ??
    join(homedir(), ".cache/propellr-reference/axe-core-4.13.0"),
);
const project = await realpath(new URL("..", import.meta.url));
const external = (path: string) => {
  const location = relative(project, path);
  if (!isAbsolute(location) && location !== ".." && !location.startsWith(`..${sep}`))
    throw new Error("Reference cache must be outside this project");
};
// This standalone POSIX CLI uses cwd as a held directory reference. Relative writes cannot
// be redirected by replacing a checked parent pathname after entry.
async function enterExternalDirectory(path: string) {
  const expected = await lstat(path, { bigint: true });
  if (!expected.isDirectory()) throw new Error("Reference cache must be a real directory");
  process.chdir(path);
  const held = await lstat(".", { bigint: true });
  if (held.dev !== expected.dev || held.ino !== expected.ino)
    throw new Error("Reference cache directory changed");
  external(await realpath("."));
  return held;
}
// Check and hold existing ancestors before creating missing directories through an alias.
async function ensureExternalDirectory(path: string): Promise<string> {
  try {
    const actual = await realpath(path);
    external(actual);
    return actual;
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
  }
  const parent = dirname(path);
  if (parent === path) throw new Error("Reference cache ancestor is unavailable");
  await enterExternalDirectory(await ensureExternalDirectory(parent));
  const name = basename(path);
  try {
    await mkdir(name, { mode: 0o700 });
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
  }
  await enterExternalDirectory(name);
  return realpath(".");
}
if (process.platform !== "darwin" && process.platform !== "linux")
  throw new Error("Reference preparation supports macOS and Linux only");
external(requestedCache);
const cache = await ensureExternalDirectory(requestedCache);
const cacheDirectory = await enterExternalDirectory(cache);
const tarball = "axe-core-4.13.0.tgz";
const cachedTarball = await readCached(tarball);
let bytes = cachedTarball;
if (!bytes) {
  const response = await fetch(reference.primary.tarball);
  if (!response.ok) throw new Error(`Reference download failed: ${response.status}`);
  bytes = Buffer.from(await response.arrayBuffer());
}
const integrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
if (integrity !== reference.primary.integrity)
  throw new Error("Reference tarball integrity mismatch");

// Stream only approved members from verified bytes. tar never writes through cache paths.
const extracted = ["axe.min.js", "LICENSE", "package.json"].map((name) => ({
  name,
  bytes: execFileSync("tar", ["-xzOf", "-", `package/${name}`], {
    input: bytes,
    cwd: executionDirectory,
    maxBuffer: 8 * 1024 * 1024,
  }),
}));
const bundle = extracted[0]!;
const sha256 = createHash("sha256").update(bundle.bytes).digest("hex");
if (reference.primary.bundleSha256 && sha256 !== reference.primary.bundleSha256)
  throw new Error("Reference bundle hash mismatch");
if (!cachedTarball) await writeFile(tarball, bytes, { flag: "wx", mode: 0o600 });
try {
  await mkdir("package", { mode: 0o700 });
} catch (error) {
  if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
}
const packageDirectory = await enterExternalDirectory("package");
const pending: { path: string; bytes: Buffer }[] = [];
for (const entry of extracted.map(({ name, bytes }) => ({ path: name, bytes }))) {
  const cached = await readCached(entry.path);
  if (cached && !cached.equals(entry.bytes))
    throw new Error("Reference cache entry integrity mismatch");
  if (!cached) pending.push(entry);
}
for (const entry of pending) await writeFile(entry.path, entry.bytes, { flag: "wx", mode: 0o600 });
for (const [path, expected] of [
  [cache, cacheDirectory],
  [join(cache, "package"), packageDirectory],
] as const) {
  const current = await lstat(path, { bigint: true });
  if (!current.isDirectory() || current.dev !== expected.dev || current.ino !== expected.ino)
    throw new Error("Reference cache directory changed");
}
console.log(JSON.stringify({ cache, integrity, bundleSha256: sha256 }, null, 2));
