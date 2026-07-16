import type { GaiaRegistrySource } from "./data/source.js";
import {
  GAIA_PUBLIC_CONTRACT_VERSION,
  type GaiaRegistrySnapshot,
  type InspectResult,
  type NamedSkill,
  type NamedSkillSummary,
  type ResultMetadata,
  type SearchInput,
  type SearchResult,
  type SearchResultItem,
  type StatusResult,
} from "./domain/types.js";
import { VERSION } from "./version.js";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;
const DEFAULT_MAX_DATA_AGE_MS = 72 * 60 * 60 * 1_000;

export type GaiaServiceOptions = {
  now?: () => Date;
  maxDataAgeMs?: number;
  serverVersion?: string;
};

type ScoredResult = SearchResultItem & { score: number };

export class GaiaService {
  readonly #source: GaiaRegistrySource;
  readonly #now: () => Date;
  readonly #maxDataAgeMs: number;
  readonly #serverVersion: string;

  constructor(source: GaiaRegistrySource, options: GaiaServiceOptions = {}) {
    this.#source = source;
    this.#now = options.now ?? (() => new Date());
    this.#maxDataAgeMs = options.maxDataAgeMs ?? DEFAULT_MAX_DATA_AGE_MS;
    this.#serverVersion = options.serverVersion ?? VERSION;
  }

  async search(input: SearchInput): Promise<SearchResult> {
    const query = input.query.trim();
    if (query.length === 0) {
      throw new Error("Search query must not be empty.");
    }

    const snapshot = await this.#source.load();
    const kinds = new Set(input.kinds ?? ["generic", "named"]);
    const allowedTypes = input.types
      ? new Set(input.types.map((value) => normalize(value)))
      : undefined;
    const scored: ScoredResult[] = [];

    if (kinds.has("generic")) {
      for (const skill of snapshot.generic.skills) {
        if (allowedTypes && !allowedTypes.has(normalize(skill.type))) continue;
        const score = scoreMatch(query, [
          [skill.name, 12],
          [skill.id, 10],
          [skill.title ?? "", 8],
          [skill.summary ?? "", 4],
          [skill.description, 3],
        ]);
        if (score === 0) continue;
        scored.push({
          score: score + 1,
          kind: "generic",
          id: skill.id,
          name: skill.name,
          ...(skill.title ? { title: skill.title } : {}),
          description: skill.description,
          type: skill.type,
          status: skill.status,
          ...(skill.namedMaxLevel ? { level: skill.namedMaxLevel } : {}),
          ...(skill.overallTrustGrade
            ? { overallTrustGrade: skill.overallTrustGrade }
            : {}),
          evidenceCount: skill.evidence.length,
        });
      }
    }

    if (kinds.has("named")) {
      for (const skill of flattenNamed(snapshot)) {
        if (allowedTypes && skill.type && !allowedTypes.has(normalize(skill.type))) {
          continue;
        }
        const score = scoreMatch(query, [
          [skill.name, 12],
          [skill.id, 10],
          [skill.title ?? "", 10],
          [skill.catalogRef ?? "", 8],
          [skill.genericSkillRef, 8],
          [skill.tags.join(" "), 6],
          [skill.description, 3],
        ]);
        if (score === 0) continue;
        scored.push({
          score,
          kind: "named",
          id: skill.id,
          name: skill.name,
          ...(skill.title ? { title: skill.title } : {}),
          description: skill.description,
          ...(skill.type ? { type: skill.type } : {}),
          status: skill.status,
          genericSkillRef: skill.genericSkillRef,
          level: skill.level,
          ...(skill.trustMagnitude === undefined
            ? {}
            : { trustMagnitude: skill.trustMagnitude }),
          ...(skill.overallTrustGrade
            ? { overallTrustGrade: skill.overallTrustGrade }
            : {}),
          evidenceCount: skill.evidence.length,
          ...(typeof skill.links.github === "string"
            ? { sourceUrl: skill.links.github }
            : {}),
        });
      }
    }

    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const results = scored
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.kind.localeCompare(right.kind) ||
          left.name.localeCompare(right.name),
      )
      .slice(0, limit)
      .map(({ score: _score, ...result }) => result);

    return { query, results, meta: this.#metadata(snapshot) };
  }

  async inspect(identifier: string): Promise<InspectResult> {
    const normalizedIdentifier = identifier.trim();
    const snapshot = await this.#source.load();
    const generic = snapshot.generic.skills.find(
      (skill) => skill.id === normalizedIdentifier,
    );

    if (generic) {
      const namedImplementations = flattenNamed(snapshot)
        .filter((skill) => skill.genericSkillRef === generic.id)
        .map(toNamedSummary)
        .sort(
          (left, right) =>
            (right.trustMagnitude ?? -1) - (left.trustMagnitude ?? -1) ||
            left.name.localeCompare(right.name),
        );
      return {
        skill: {
          kind: "generic",
          ...generic,
          namedImplementations,
        },
        meta: this.#metadata(snapshot),
      };
    }

    const named = flattenNamed(snapshot).find(
      (skill) =>
        skill.id === normalizedIdentifier ||
        skill.catalogRef === normalizedIdentifier,
    );
    if (named) {
      const genericSkill = snapshot.generic.skills.find(
        (skill) => skill.id === named.genericSkillRef,
      );
      return {
        skill: {
          kind: "named",
          ...named,
          ...(genericSkill
            ? {
                genericSkill: {
                  id: genericSkill.id,
                  name: genericSkill.name,
                  type: genericSkill.type,
                  status: genericSkill.status,
                },
              }
            : {}),
        },
        meta: this.#metadata(snapshot),
      };
    }

    throw new Error(`Gaia skill not found: ${normalizedIdentifier}`);
  }

  async status(): Promise<StatusResult> {
    const snapshot = await this.#source.load();
    return {
      serverVersion: this.#serverVersion,
      mode: "registry",
      counts: {
        genericSkills: snapshot.generic.skills.length,
        namedSkills: flattenNamed(snapshot).length,
      },
      tools: ["gaia_search", "gaia_inspect", "gaia_status"],
      bondedCapabilities: false,
      compatibility: {
        mcpSdk: "@modelcontextprotocol/sdk@1.29.0",
        node: ">=22.14.0",
        transports: ["stdio"],
      },
      ...this.#metadata(snapshot),
    };
  }

  #metadata(snapshot: GaiaRegistrySnapshot): ResultMetadata {
    const generatedTimes = [
      Date.parse(snapshot.generic.generatedAt),
      Date.parse(snapshot.named.generatedAt),
    ].filter(Number.isFinite);
    const oldestGeneratedAt = Math.min(...generatedTimes);
    const stale =
      generatedTimes.length !== 2 ||
      this.#now().getTime() - oldestGeneratedAt > this.#maxDataAgeMs;

    return {
      contractVersion: GAIA_PUBLIC_CONTRACT_VERSION,
      freshness: stale ? "stale" : "fresh",
      genericGeneratedAt: snapshot.generic.generatedAt,
      namedGeneratedAt: snapshot.named.generatedAt,
      fetchedAt: snapshot.source.fetchedAt,
      sources: {
        generic: snapshot.source.genericUrl,
        named: snapshot.source.namedUrl,
      },
    };
  }
}

function flattenNamed(snapshot: GaiaRegistrySnapshot): NamedSkill[] {
  return Object.values(snapshot.named.buckets).flat();
}

function toNamedSummary(skill: NamedSkill): NamedSkillSummary {
  return {
    id: skill.id,
    name: skill.name,
    ...(skill.title ? { title: skill.title } : {}),
    contributor: skill.contributor,
    level: skill.level,
    description: skill.description,
    ...(skill.catalogRef ? { catalogRef: skill.catalogRef } : {}),
    ...(skill.trustMagnitude === undefined
      ? {}
      : { trustMagnitude: skill.trustMagnitude }),
    ...(skill.overallTrustGrade
      ? { overallTrustGrade: skill.overallTrustGrade }
      : {}),
    ...(typeof skill.links.github === "string"
      ? { sourceUrl: skill.links.github }
      : {}),
  };
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreMatch(
  query: string,
  weightedFields: ReadonlyArray<readonly [value: string, weight: number]>,
): number {
  const normalizedQuery = normalize(query);
  const tokens = [...new Set(normalizedQuery.split(" ").filter(Boolean))];
  let score = 0;

  for (const [rawValue, weight] of weightedFields) {
    const value = normalize(rawValue);
    if (!value) continue;
    if (value === normalizedQuery) score += weight * 10;
    else if (value.includes(normalizedQuery)) score += weight * 5;
    for (const token of tokens) {
      if (value.split(" ").includes(token)) score += weight;
      else if (value.includes(token)) score += weight / 2;
    }
  }

  return score;
}
