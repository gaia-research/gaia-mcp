import {
  access,
  mkdir,
  mkdtemp,
  rm,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { reapSessions, SummonSession } from "../src/summon/session.js";

const cleanupRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    cleanupRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("summon session garbage collection", () => {
  it("reaps expired abandoned roots but protects live and young sessions", async () => {
    const parent = await temporaryParent();
    const now = new Date("2026-04-01T12:00:00.000Z");
    const old = "2026-04-01T05:00:00.000Z";
    const young = "2026-04-01T11:30:00.000Z";
    const abandoned = await sessionRoot(parent, "abandoned", old, 99_999_999);
    const live = await sessionRoot(parent, "live", old, process.pid);
    const recent = await sessionRoot(parent, "recent", young, 99_999_999);

    const outcome = await reapSessions({ tempRoot: parent, ttlHours: 4, now });

    expect(outcome.candidates.map((item) => item.root)).toEqual([abandoned]);
    expect(outcome.liveProtected).toEqual([live]);
    await expect(access(abandoned)).rejects.toThrow();
    await expect(access(live)).resolves.toBeUndefined();
    await expect(access(recent)).resolves.toBeUndefined();
  });

  it("reports dry-run candidates without deleting them", async () => {
    const parent = await temporaryParent();
    const root = path.join(parent, "gaia-hell-malformed");
    await mkdir(root);
    await writeFile(path.join(root, "session.json"), "not json");
    await utimes(root, new Date(0), new Date(0));

    const outcome = await reapSessions({
      dryRun: true,
      tempRoot: parent,
      ttlHours: 1,
      now: new Date("2026-04-01T12:00:00.000Z"),
    });

    expect(outcome.candidates).toHaveLength(1);
    await expect(access(root)).resolves.toBeUndefined();
  });

  it("close removes the complete owned root", async () => {
    const parent = await temporaryParent();
    const root = path.join(parent, "gaia-hell-close");
    await mkdir(root);
    const session = await SummonSession.createAt(root, "close-test");
    await session.ensureRoots();
    await writeFile(path.join(session.cacheRoot, "scaffolding"), "clone");
    await writeFile(path.join(session.skillsRoot, "payload"), "skill");

    await session.close();

    await expect(access(root)).rejects.toThrow();
  });
});

async function temporaryParent(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "gaia-hell-gc-test-"));
  cleanupRoots.push(root);
  return root;
}

async function sessionRoot(
  parent: string,
  name: string,
  createdAt: string,
  pid: number,
): Promise<string> {
  const root = path.join(parent, `gaia-hell-${name}`);
  await mkdir(root);
  await writeFile(
    path.join(root, "session.json"),
    JSON.stringify({ id: name, createdAt, pid, skills: [] }),
  );
  return root;
}
