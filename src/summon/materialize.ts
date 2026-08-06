import { cp, readdir } from "node:fs/promises";
import path from "node:path";

export type MaterializeOutcome = {
  path: string;
  seconds: number;
  fileCount: number;
};

/**
 * Copy the validated skill directory (sourceDir) into the session root at
 * destDir. A recursive copy, not a symlink: the session root is disposable
 * and must not leave dangling links once it is removed.
 *
 * `.git` directories are excluded — relevant only when a skill's subpath is
 * the repo root itself, in which case the source directory IS the cloned
 * repo and would otherwise drag its whole git history into the copy.
 */
export async function materializeSkillDir(
  sourceDir: string,
  destDir: string,
): Promise<MaterializeOutcome> {
  const start = Date.now();
  await cp(sourceDir, destDir, {
    recursive: true,
    filter: (source) => path.basename(source) !== ".git",
  });
  const fileCount = await countFiles(destDir);
  return { path: destDir, seconds: (Date.now() - start) / 1000, fileCount };
}

async function countFiles(dir: string): Promise<number> {
  let count = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += await countFiles(full);
    else count += 1;
  }
  return count;
}
