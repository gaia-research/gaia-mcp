import { stat } from "node:fs/promises";
import path from "node:path";

import type { NamedSkill } from "../domain/types.js";
import { starCount } from "../service.js";
import type { GaiaService } from "../service.js";
import { ensureCachedRepo } from "./clone.js";
import { parseGithubUrl } from "./giturl.js";
import { materializeSkillDir } from "./materialize.js";
import { rankCandidates } from "./rank.js";
import type { InstalledSkill, SummonSession } from "./session.js";

const DEFAULT_LIMIT = 1;
const MAX_LIMIT = 5;

export type SummonOptions = {
  query: string;
  limit?: number | undefined;
};

export type SkippedCandidate = {
  id: string;
  name: string;
  reason: string;
};

export type SuiteAttempt = {
  suiteId: string;
  totalComponents: number;
  succeededComponents: number;
  failedComponents: string[];
  rootHasOwnSource: boolean;
  rootInstalled: boolean;
  ok: boolean;
};

export type SummonOutcome = {
  query: string;
  summoned: InstalledSkill[];
  skipped: SkippedCandidate[];
  suites: SuiteAttempt[];
  sessionRoot: string;
  /** Wall-clock time for this whole invocation, seconds with ms precision. */
  totalSeconds: number;
};

type InstallContext = {
  session: SummonSession;
  registry: readonly NamedSkill[];
};

type InstallOutcome = {
  ok: boolean;
  installed: InstalledSkill[];
  reason?: string;
  suite?: SuiteAttempt;
};

/**
 * Rank candidates for `query`, then walk the ranking installing winners
 * (install-parity: clone, validate, materialize the whole skill directory,
 * recursing into suiteComponents) into `session` until `limit` successful
 * top-level installs is reached. A candidate that fails to install — in
 * whole or, for a suite, in part — is skipped (with a reason) in favor of
 * the next-best candidate, rather than failing the whole summon. Partial
 * suite materializations are not rolled back; they stay on disk and in
 * `summoned`, mirroring install.py's own manifest side effects on partial
 * suite failure.
 */
export async function summon(
  service: GaiaService,
  session: SummonSession,
  { query, limit = DEFAULT_LIMIT }: SummonOptions,
): Promise<SummonOutcome> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) {
    throw new Error("Summon query must not be empty.");
  }
  const boundedLimit = Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT);
  const runStart = Date.now();

  const registry = await service.namedSkills();
  const candidates = rankCandidates(registry, trimmedQuery);
  await session.ensureRoots();

  const ctx: InstallContext = { session, registry };
  const summoned: InstalledSkill[] = [];
  const skipped: SkippedCandidate[] = [];
  const suites: SuiteAttempt[] = [];
  let successCount = 0;

  for (const candidate of candidates) {
    if (successCount >= boundedLimit) break;

    const outcome = await installSkill(candidate.id, ctx, new Set());
    summoned.push(...outcome.installed);
    if (outcome.suite) suites.push(outcome.suite);

    if (outcome.ok) {
      successCount++;
    } else {
      skipped.push({
        id: candidate.id,
        name: candidate.name,
        reason: outcome.reason ?? "install failed",
      });
    }
  }

  return {
    query: trimmedQuery,
    summoned,
    skipped,
    suites,
    sessionRoot: session.root,
    totalSeconds: (Date.now() - runStart) / 1000,
  };
}

/**
 * Install one named skill by reference, expanding suiteComponents
 * recursively. Mirrors install.py's `install_skill`: `visited` is keyed on
 * the raw reference string exactly as passed in (not the canonical id), so
 * a component listed twice under different aliases is not deduplicated —
 * this matches the ported behavior exactly rather than "improving" on it.
 */
async function installSkill(
  ref: string,
  ctx: InstallContext,
  visited: Set<string>,
  viaSuite?: string,
): Promise<InstallOutcome> {
  if (visited.has(ref)) return { ok: true, installed: [] };
  visited.add(ref);

  let resolved: NamedSkill | undefined;
  try {
    resolved = resolveNamedSkillReference(ref, ctx.registry);
  } catch (error) {
    return { ok: false, installed: [], reason: errorMessage(error) };
  }
  if (!resolved) {
    return {
      ok: false,
      installed: [],
      reason: `Skill '${ref}' not found in registry.`,
    };
  }

  const suiteComponents = resolved.suiteComponents ?? [];
  if (suiteComponents.length > 0) {
    return installSuite(resolved, suiteComponents, ctx, visited, viaSuite);
  }

  return installSingle(resolved, ctx, viaSuite);
}

/**
 * Resolve a skill reference the way install.py's
 * `resolve_named_skill_reference` does: exact id, then unambiguous
 * catalogRef, then unambiguous bare name (id with the contributor prefix
 * stripped). Ambiguous matches throw, matching Python's ValueError.
 */
function resolveNamedSkillReference(
  ref: string,
  registry: readonly NamedSkill[],
): NamedSkill | undefined {
  const cleaned = ref.replace(/^\/+/, "");

  const exact = registry.find((skill) => skill.id === cleaned);
  if (exact) return exact;

  const catalogMatches = registry.filter((skill) => skill.catalogRef === cleaned);
  if (catalogMatches.length === 1) return catalogMatches[0];
  if (catalogMatches.length > 1) {
    throw new Error(`Ambiguous slug '${cleaned}' matches multiple skills.`);
  }

  const bareMatches = registry.filter((skill) => {
    const slash = skill.id.indexOf("/");
    return slash !== -1 && skill.id.slice(slash + 1) === cleaned;
  });
  if (bareMatches.length === 1) return bareMatches[0];
  if (bareMatches.length > 1) {
    throw new Error(`Ambiguous bare name '${cleaned}' matches multiple skills.`);
  }

  return undefined;
}

/**
 * Recursive suite install, mirroring install.py's `install_suite`: install
 * every component (via installSkill, so nested suites recurse correctly),
 * then — if the suite root itself carries its own links.github — install
 * the root too via installSingle directly (bypassing installSkill/visited,
 * exactly as `_install_single` is called directly in the Python to avoid
 * infinite recursion). Success requires every attempted component AND the
 * root (if attempted) to succeed.
 *
 * Each materialized skill is recorded into the session manifest exactly
 * once, at its point of creation in installSingle — `viaSuite` is threaded
 * down as a parameter (this suite's id for components, the caller's
 * viaSuite for this suite's own root) rather than re-recorded here, so a
 * nested suite's leaves are never double-recorded.
 */
async function installSuite(
  suiteSkill: NamedSkill,
  components: readonly string[],
  ctx: InstallContext,
  visited: Set<string>,
  viaSuite: string | undefined,
): Promise<InstallOutcome> {
  const installed: InstalledSkill[] = [];
  const failed: string[] = [];
  let succeededComponents = 0;

  for (const componentRef of components) {
    const result = await installSkill(componentRef, ctx, visited, suiteSkill.id);
    installed.push(...result.installed);
    if (result.ok) {
      succeededComponents++;
    } else {
      const componentMeta = resolveSafely(componentRef, ctx.registry);
      const isNestedSuite = (componentMeta?.suiteComponents?.length ?? 0) > 0;
      failed.push(
        isNestedSuite ? `${componentRef} (nested suite — see above)` : componentRef,
      );
    }
  }

  const rootHasOwnSource = typeof suiteSkill.links.github === "string";
  let rootInstalled = false;
  if (rootHasOwnSource) {
    const rootResult = await installSingle(suiteSkill, ctx, viaSuite);
    if (rootResult.ok) {
      rootInstalled = true;
      installed.push(...rootResult.installed);
    } else {
      failed.push(suiteSkill.id);
    }
  }

  const ok = failed.length === 0;
  const totalAttempted = components.length + (rootHasOwnSource ? 1 : 0);
  const succeededAttempted = succeededComponents + (rootInstalled ? 1 : 0);
  const suite: SuiteAttempt = {
    suiteId: suiteSkill.id,
    totalComponents: components.length,
    succeededComponents,
    failedComponents: failed,
    rootHasOwnSource,
    rootInstalled,
    ok,
  };

  return {
    ok,
    installed,
    suite,
    ...(ok
      ? {}
      : {
          reason: `Suite ${suiteSkill.id}: ${succeededAttempted}/${totalAttempted} installed. Failed: ${failed.join(", ")}`,
        }),
  };
}

function resolveSafely(
  ref: string,
  registry: readonly NamedSkill[],
): NamedSkill | undefined {
  try {
    return resolveNamedSkillReference(ref, registry);
  } catch {
    return undefined;
  }
}

/**
 * Install a single (non-suite) skill: registry-only guard, source-link
 * guard, clone/update the owning repo into the session cache, validate the
 * resolved subpath (exists, is a directory, contains SKILL.md — a stale
 * links.github must never report success), then materialize the whole
 * directory into the session's skills/ root. Mirrors install.py's
 * `_install_single` exactly, except linking is a copy (see materialize.ts)
 * rather than a symlink/junction, since the session root is disposable.
 */
async function installSingle(
  skill: NamedSkill,
  ctx: InstallContext,
  viaSuite?: string,
): Promise<InstallOutcome> {
  if (skill.installable === false) {
    return {
      ok: false,
      installed: [],
      reason: `Skill '${skill.id}' is marked registry-only (installable: false).`,
    };
  }

  const githubUrl =
    typeof skill.links.github === "string" ? skill.links.github : undefined;
  if (!githubUrl) {
    return {
      ok: false,
      installed: [],
      reason: `Skill '${skill.id}' has no source repository link.`,
    };
  }

  const { repoUrl, branch, subpath } = parseGithubUrl(githubUrl);
  const cacheOwner = skill.id.split("/", 1)[0] ?? skill.contributor;
  const repoName = (repoUrl.split("/").pop() ?? repoUrl).replace(/\.git$/, "");
  const cacheDir = path.join(ctx.session.cacheRoot, cacheOwner, repoName);

  let cloneOutcome;
  try {
    cloneOutcome = await ensureCachedRepo(cacheDir, repoUrl, branch);
  } catch (error) {
    return {
      ok: false,
      installed: [],
      reason: `Could not clone ${repoUrl}: ${errorMessage(error)}`,
    };
  }

  const sourceSkillPath = path.join(cloneOutcome.path, subpath);
  let sourceStat;
  try {
    sourceStat = await stat(sourceSkillPath);
  } catch {
    return {
      ok: false,
      installed: [],
      reason: `subpath '${subpath}' not found in ${repoUrl}; the link may be stale.`,
    };
  }
  if (!sourceStat.isDirectory()) {
    return {
      ok: false,
      installed: [],
      reason: `links.github for '${skill.id}' points at a file, not a skill directory (${sourceSkillPath}).`,
    };
  }
  if (!(await pathExists(path.join(sourceSkillPath, "SKILL.md")))) {
    return {
      ok: false,
      installed: [],
      reason: `no SKILL.md at ${sourceSkillPath}.`,
    };
  }

  const safeId = skill.id.replaceAll("/", "__");
  const destDir = path.join(ctx.session.skillsRoot, safeId);

  let materializeOutcome;
  try {
    materializeOutcome = await materializeSkillDir(sourceSkillPath, destDir);
  } catch (error) {
    return {
      ok: false,
      installed: [],
      reason: `Could not materialize ${sourceSkillPath}: ${errorMessage(error)}`,
    };
  }

  const installedSkill: InstalledSkill = {
    id: skill.id,
    name: skill.name,
    contributor: skill.contributor,
    level: skill.level,
    ...(skill.trustMagnitude === undefined
      ? {}
      : { trustMagnitude: skill.trustMagnitude }),
    stars: starCount(skill.level),
    sourceUrl: githubUrl,
    repoUrl,
    branch,
    subpath,
    path: materializeOutcome.path,
    fileCount: materializeOutcome.fileCount,
    cache: cloneOutcome.warm ? "warm" : "cold",
    cloneSeconds: cloneOutcome.seconds,
    materializeSeconds: materializeOutcome.seconds,
    totalSeconds: cloneOutcome.seconds + materializeOutcome.seconds,
  };

  await ctx.session.recordSkill(installedSkill, { viaSuite });
  return { ok: true, installed: [installedSkill] };
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
