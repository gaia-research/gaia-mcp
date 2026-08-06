import type { NamedSkill } from "../domain/types.js";
import { starCount } from "../service.js";
import type { GaiaService } from "../service.js";
import { fetchSkillFile, toRawUrl } from "./fetch.js";
import { rankCandidates } from "./rank.js";
import type { SummonSession } from "./session.js";

const DEFAULT_LIMIT = 1;
const MAX_LIMIT = 5;

export type SummonOptions = {
  query: string;
  limit?: number | undefined;
};

export type SummonResult = {
  id: string;
  name: string;
  contributor: string;
  level: string;
  trustMagnitude?: number | undefined;
  stars: number;
  sourceUrl: string;
  path: string;
  bytes: number;
  sha256: string;
};

export type SkippedCandidate = {
  id: string;
  name: string;
  reason: string;
};

export type SummonOutcome = {
  query: string;
  summoned: SummonResult[];
  skipped: SkippedCandidate[];
  sessionRoot: string;
};

/**
 * Rank candidates for `query`, then walk the ranking materializing winners
 * into `session` until `limit` is reached. A candidate that fails to fetch
 * is skipped (with a reason) in favor of the next-best candidate, rather
 * than failing the whole summon.
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

  const candidates = rankCandidates(await service.namedSkills(), trimmedQuery);
  const summoned: SummonResult[] = [];
  const skipped: SkippedCandidate[] = [];

  for (const candidate of candidates) {
    if (summoned.length >= boundedLimit) break;
    const result = await trySummon(candidate, session, skipped);
    if (result) summoned.push(result);
  }

  return { query: trimmedQuery, summoned, skipped, sessionRoot: session.root };
}

async function trySummon(
  candidate: NamedSkill,
  session: SummonSession,
  skipped: SkippedCandidate[],
): Promise<SummonResult | undefined> {
  const githubUrl =
    typeof candidate.links.github === "string"
      ? candidate.links.github
      : undefined;
  if (!githubUrl) {
    skipped.push({
      id: candidate.id,
      name: candidate.name,
      reason: "no github source link",
    });
    return undefined;
  }

  const rawUrl = toRawUrl(githubUrl);
  if (!rawUrl) {
    skipped.push({
      id: candidate.id,
      name: candidate.name,
      reason: `source is not a fetchable SKILL.md: ${githubUrl}`,
    });
    return undefined;
  }

  try {
    const fetched = await fetchSkillFile(rawUrl);
    const { path } = await session.materialize(
      {
        id: candidate.id,
        name: candidate.name,
        contributor: candidate.contributor,
        level: candidate.level,
        trustMagnitude: candidate.trustMagnitude,
        sourceUrl: githubUrl,
      },
      fetched.content,
    );
    return {
      id: candidate.id,
      name: candidate.name,
      contributor: candidate.contributor,
      level: candidate.level,
      trustMagnitude: candidate.trustMagnitude,
      stars: starCount(candidate.level),
      sourceUrl: githubUrl,
      path,
      bytes: fetched.bytes,
      sha256: fetched.sha256,
    };
  } catch (error) {
    skipped.push({
      id: candidate.id,
      name: candidate.name,
      reason: errorMessage(error),
    });
    return undefined;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
