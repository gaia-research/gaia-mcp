import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const SESSION_DIR_PREFIX = "gaia-hell-";
const MANIFEST_FILE = "session.json";

export type MaterializedSkillRecord = {
  id: string;
  name: string;
  contributor: string;
  level: string;
  trustMagnitude?: number | undefined;
  sourceUrl: string;
  path: string;
  bytes: number;
  sha256: string;
  materializedAt: string;
};

export type SessionManifest = {
  id: string;
  createdAt: string;
  pid: number;
  skills: MaterializedSkillRecord[];
};

export type MaterializeInput = {
  id: string;
  name: string;
  contributor: string;
  level: string;
  trustMagnitude?: number | undefined;
  sourceUrl: string;
};

export type OpenSessionOptions = {
  id?: string | undefined;
};

export type ResolveSessionResult = {
  session: SummonSession;
  created: boolean;
};

/**
 * A session is a single mkdtemp root. All summon writes are confined to it
 * (invariant P3: never write outside the session root, never touch user
 * config). Closing a session deletes the root and everything under it.
 */
export class SummonSession {
  readonly root: string;
  readonly id: string;
  readonly #manifestPath: string;
  #manifest: SessionManifest;

  private constructor(root: string, manifest: SessionManifest) {
    this.root = root;
    this.id = manifest.id;
    this.#manifestPath = path.join(root, MANIFEST_FILE);
    this.#manifest = manifest;
  }

  static async createAt(root: string, id: string): Promise<SummonSession> {
    const manifest: SessionManifest = {
      id,
      createdAt: new Date().toISOString(),
      pid: process.pid,
      skills: [],
    };
    const session = new SummonSession(root, manifest);
    await session.#writeManifest();
    return session;
  }

  static async loadAt(root: string): Promise<SummonSession> {
    const manifestPath = path.join(root, MANIFEST_FILE);
    let raw: string;
    try {
      raw = await readFile(manifestPath, "utf8");
    } catch (error) {
      throw new Error(
        `GAIA_HELL_SESSION points at ${root}, but no session manifest was found there: ${errorMessage(error)}`,
      );
    }
    const manifest = JSON.parse(raw) as SessionManifest;
    return new SummonSession(root, manifest);
  }

  get createdAt(): string {
    return this.#manifest.createdAt;
  }

  get skills(): readonly MaterializedSkillRecord[] {
    return this.#manifest.skills;
  }

  async materialize(
    skill: MaterializeInput,
    content: string,
  ): Promise<{ path: string }> {
    const safeId = skill.id.replaceAll("/", "__");
    const dir = path.join(this.root, "skills", safeId);
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, "SKILL.md");
    await writeFile(filePath, content, "utf8");

    const record: MaterializedSkillRecord = {
      id: skill.id,
      name: skill.name,
      contributor: skill.contributor,
      level: skill.level,
      ...(skill.trustMagnitude === undefined
        ? {}
        : { trustMagnitude: skill.trustMagnitude }),
      sourceUrl: skill.sourceUrl,
      path: filePath,
      bytes: Buffer.byteLength(content, "utf8"),
      sha256: createHash("sha256").update(content, "utf8").digest("hex"),
      materializedAt: new Date().toISOString(),
    };
    this.#manifest.skills.push(record);
    await this.#writeManifest();
    return { path: filePath };
  }

  async close(): Promise<void> {
    await rm(this.root, { recursive: true, force: true });
  }

  async #writeManifest(): Promise<void> {
    await writeFile(
      this.#manifestPath,
      JSON.stringify(this.#manifest, null, 2),
      "utf8",
    );
  }
}

export async function openSession(
  opts: OpenSessionOptions = {},
): Promise<SummonSession> {
  const root = await mkdtemp(path.join(tmpdir(), SESSION_DIR_PREFIX));
  return SummonSession.createAt(root, opts.id ?? randomUUID());
}

/**
 * Reuse the session root named by GAIA_HELL_SESSION if it is set, so
 * multiple gaia-hell invocations in one shell share a session. Otherwise
 * open a fresh session; callers should surface `created` so the invoker
 * knows to export GAIA_HELL_SESSION to keep reusing it.
 */
export async function resolveSession(
  opts: OpenSessionOptions = {},
): Promise<ResolveSessionResult> {
  const existingRoot = process.env.GAIA_HELL_SESSION;
  if (existingRoot) {
    return {
      session: await SummonSession.loadAt(existingRoot),
      created: false,
    };
  }
  return { session: await openSession(opts), created: true };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
