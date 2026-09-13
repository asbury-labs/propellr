import { expect, test } from "vitest";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import reference from "../../reference.json" with { type: "json" };

test("reference preparation rejects linked cache entries and never rewrites verified files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "propellr-cache-safety-"));
  const worktree = join(directory, "worktree");
  const tool = join(worktree, "tools/reference.ts");
  const tarballName = "axe-core-4.13.0.tgz";
  const prepare = (cache: string, hook?: string) =>
    spawnSync(process.execPath, [...(hook ? ["--import", hook] : []), tool], {
      env: { ...process.env, PROPELLR_REFERENCE_CACHE: cache },
      encoding: "utf8",
      timeout: 20_000,
    });
  try {
    const bytes = await readFile(
      join(
        process.env["PROPELLR_REFERENCE_CACHE"] ??
          join(homedir(), ".cache/propellr-reference/axe-core-4.13.0"),
        tarballName,
      ),
    );
    await mkdir(join(worktree, "tools"), { recursive: true });
    await copyFile(new URL("../../tools/reference.ts", import.meta.url), tool);
    await copyFile(
      new URL("../../reference.json", import.meta.url),
      join(worktree, "reference.json"),
    );
    await writeFile(join(worktree, "package.json"), '{"private":true,"type":"module"}');
    const sentinel = join(worktree, "user-file");
    await writeFile(sentinel, "preserve user work");
    const pinned = join(worktree, "user-artifact.tgz");
    await writeFile(pinned, bytes);
    const originalTime = (await stat(pinned)).mtimeMs;
    const absent = join(worktree, "must-not-be-created");
    const linkedParent = join(directory, "linked-parent");
    await symlink(worktree, linkedParent);
    const redirected = prepare(join(linkedParent, "must-not-create-cache"));
    expect(redirected.status, redirected.stderr).toBe(1);
    expect(redirected.stderr).toContain("Reference cache must be outside this project");
    await expect(lstat(join(worktree, "must-not-create-cache"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    const targetDirectory = join(worktree, "user-directory");
    await mkdir(targetDirectory);
    await writeFile(join(targetDirectory, "marker"), "preserve directory");
    for (const vector of [
      "broken-tarball",
      "existing-tarball",
      "package-directory",
      "bundle-entry",
    ] as const) {
      const cache = join(directory, vector);
      await mkdir(cache);
      if (vector === "broken-tarball" || vector === "existing-tarball") {
        await symlink(vector === "broken-tarball" ? absent : pinned, join(cache, tarballName));
      } else {
        await writeFile(join(cache, tarballName), bytes);
        if (vector === "package-directory") await symlink(targetDirectory, join(cache, "package"));
        else {
          await mkdir(join(cache, "package"));
          await symlink(sentinel, join(cache, "package/axe.min.js"));
        }
      }
      const result = prepare(cache);
      expect(result.status, result.stderr).toBe(1);
      expect(result.stderr).toMatch(
        vector === "package-directory" ? /must be a real directory/ : /ELOOP/,
      );
    }
    expect(await readFile(sentinel, "utf8")).toBe("preserve user work");
    expect((await stat(pinned)).mtimeMs).toBe(originalTime);
    await expect(lstat(absent)).rejects.toMatchObject({ code: "ENOENT" });
    expect(await readdir(targetDirectory)).toEqual(["marker"]);

    await mkdir(join(worktree, "package"));
    for (const vector of ["root", "package"] as const) {
      const cache = join(directory, `race-${vector}`);
      await mkdir(cache);
      await writeFile(join(cache, tarballName), bytes);
      const swap = vector === "root" ? cache : join(cache, "package");
      const held = `${swap}-held`;
      const marker = join(directory, `race-${vector}-fired`);
      const hook = join(directory, `race-${vector}.mjs`);
      // Interpose a real rename/symlink immediately before the first actual output write.
      await writeFile(
        hook,
        `import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
const original = fs.promises.writeFile;
let fired = false;
fs.promises.writeFile = async (...args) => {
  if (!fired) {
    fired = true;
    fs.renameSync(${JSON.stringify(swap)}, ${JSON.stringify(held)});
    fs.symlinkSync(${JSON.stringify(worktree)}, ${JSON.stringify(swap)});
    fs.writeFileSync(${JSON.stringify(marker)}, 'fired');
  }
  return original(...args);
};
syncBuiltinESMExports();`,
      );
      const result = prepare(cache, hook);
      expect(await readFile(marker, "utf8")).toBe("fired");
      expect(result.status, result.stderr).toBe(1);
      expect(result.stderr).toContain("Reference cache directory changed");
      const heldBundle = join(held, vector === "root" ? "package/axe.min.js" : "axe.min.js");
      expect(
        createHash("sha256")
          .update(await readFile(heldBundle))
          .digest("hex"),
      ).toBe(reference.primary.bundleSha256);
      await expect(lstat(join(worktree, "axe.min.js"))).rejects.toMatchObject({ code: "ENOENT" });
      expect(await readdir(join(worktree, "package"))).toEqual([]);
    }

    const cache = join(directory, "regular-cache");
    await mkdir(cache);
    await writeFile(join(cache, tarballName), bytes);
    const first = prepare(cache);
    expect(first.status, first.stderr).toBe(0);
    const bundle = join(cache, "package/axe.min.js");
    expect(
      createHash("sha256")
        .update(await readFile(bundle))
        .digest("hex"),
    ).toBe(reference.primary.bundleSha256);
    const before = await Promise.all(
      [join(cache, tarballName), bundle].map(async (path) => (await stat(path)).mtimeMs),
    );
    const second = prepare(cache);
    expect(second.status, second.stderr).toBe(0);
    expect(
      await Promise.all(
        [join(cache, tarballName), bundle].map(async (path) => (await stat(path)).mtimeMs),
      ),
    ).toEqual(before);

    for (const entry of ["tarball", "bundle"] as const) {
      for (const matching of [true, false]) {
        const raceCache = join(directory, `exclusive-${entry}-${matching}`);
        await mkdir(raceCache);
        if (entry === "bundle") await writeFile(join(raceCache, tarballName), bytes);
        const marker = join(directory, `exclusive-${entry}-${matching}-fired`);
        const hook = join(directory, `exclusive-${entry}-${matching}.mjs`);
        await writeFile(
          hook,
          `import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
globalThis.fetch = async (url) => {
  if (url !== ${JSON.stringify(reference.primary.tarball)}) throw new Error('Unexpected download');
  return new Response(fs.readFileSync(${JSON.stringify(pinned)}));
};
const original = fs.promises.writeFile;
let fired = false;
fs.promises.writeFile = async (...args) => {
  if (!fired) {
    fired = true;
    fs.writeFileSync(args[0], ${matching ? "args[1]" : "'conflicting winner'"}, { flag: 'wx' });
    fs.writeFileSync(${JSON.stringify(marker)}, 'fired');
  }
  return original(...args);
};
syncBuiltinESMExports();`,
        );
        const result = prepare(raceCache, hook);
        expect(await readFile(marker, "utf8")).toBe("fired");
        expect(result.status, result.stderr).toBe(matching ? 0 : 1);
        if (!matching) expect(result.stderr).toContain("Reference cache entry integrity mismatch");
        const destination = join(
          raceCache,
          entry === "tarball" ? tarballName : "package/axe.min.js",
        );
        expect(await readFile(destination)).toEqual(
          matching
            ? entry === "tarball"
              ? bytes
              : await readFile(bundle)
            : Buffer.from("conflicting winner"),
        );
      }
    }
    for (const stage of ["headers", "body"]) {
      const stalledCache = join(directory, `stalled-${stage}`);
      await mkdir(stalledCache);
      const marker = join(directory, `stalled-${stage}-signal`);
      const received = join(directory, `stalled-${stage}-received`);
      const hook = join(directory, `stalled-${stage}.mjs`);
      await writeFile(
        hook,
        `import fs from 'node:fs';
import { createServer } from 'node:http';
const server = createServer((_request, response) => {
  fs.writeFileSync(${JSON.stringify(received)}, 'received');
  ${stage === "body" ? "response.writeHead(200); response.write('unfinished archive');" : ""}
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const timeout = AbortSignal.timeout.bind(AbortSignal);
AbortSignal.timeout = milliseconds => {
  if (milliseconds !== 30_000) throw new Error('Unexpected reference deadline');
  return timeout(200);
};
const fetch = globalThis.fetch;
globalThis.fetch = (url, options) => {
  if (url !== ${JSON.stringify(reference.primary.tarball)} || !options?.signal) {
    server.close(); throw new Error('Missing reference deadline');
  }
  options.signal.addEventListener('abort', () => {
    fs.writeFileSync(${JSON.stringify(marker)}, 'aborted');
    setImmediate(() => { server.closeAllConnections(); server.close(); });
  }, { once: true });
  return fetch('http://127.0.0.1:' + address.port, options);
};`,
      );
      const result = prepare(stalledCache, hook);
      expect(result.status, result.stderr).toBe(1);
      expect(await readFile(received, "utf8")).toBe("received");
      expect(await readFile(marker, "utf8")).toBe("aborted");
      expect(result.stderr).toMatch(/TimeoutError|AbortError/);
      expect(await readdir(stalledCache)).toEqual([]);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
