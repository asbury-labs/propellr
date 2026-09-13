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
  const prepare = (cache: string) =>
    spawnSync(process.execPath, [tool], {
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
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
