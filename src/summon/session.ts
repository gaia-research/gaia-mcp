import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const SESSION_DIR_PREFIX = "gaia-hell-";
const MANIFEST_FILE = "session.json";

export type InstalledSkill = {
  id: string;
  name: string;
  contributor: string;
  level: string;
  trustMagnitude?: number | undefined;
  stars: number;
  sourceUrl: string;
  repoUrl: string;
  branch: string | null;
  subpath: string;
  path: string;
  fileCount: number;
  sha256: string;
  /** "cold" = repo cache was freshly cloned; "warm" = an existing cache was reused. */
  cacheState: "cold" | "warm";
  cloneSeconds: number;
  materializeSeconds: number;
  totalSeconds: number;
};

export type MaterializedSkillRecord = InstalledSkill & {
  materializedAt: string;
  /** Set when this skill was pulled in as a suite component, not summoned directly. */
  viaSuite?: string | undefined;
};

export type SessionManifest = {
  id: string;
  createdAt: string;
  pid: number;
  skills: MaterializedSkillRecord[];
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

  /** Directory under which git caches for this session live: <root>/cache/. */
  get cacheRoot(): string {
    return path.join(this.root, "cache");
  }

  /** Directory under which materialized skills for this session live: <root>/skills/. */
  get skillsRoot(): string {
    return path.join(this.root, "skills");
  }

  async ensureRoots(): Promise<void> {
    await mkdir(this.cacheRoot, { recursive: true });
    await mkdir(this.skillsRoot, { recursive: true });
  }

  /** Record a skill (or suite component) already materialized on disk into the session manifest. */
  async recordSkill(
    skill: InstalledSkill,
    opts: { viaSuite?: string | undefined } = {},
  ): Promise<void> {
    const record: MaterializedSkillRecord = {
      ...skill,
      ...(opts.viaSuite === undefined ? {} : { viaSuite: opts.viaSuite }),
      materializedAt: new Date().toISOString(),
    };
    this.#manifest.skills.push(record);
    await this.#writeManifest();
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
