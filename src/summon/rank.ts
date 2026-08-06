import { isInstallable, scoreMatch, starCount } from "../service.js";
import type { NamedSkill } from "../domain/types.js";

/**
 * Untuned ranking: no learned weighting, just a fixed sort order. Good
 * enough to pick a plausible winner today; real relevance benchmarks come
 * later. Uninstallable candidates are filtered out entirely — they can
 * never be summoned regardless of rank.
 */
export function rankCandidates(
  candidates: readonly NamedSkill[],
  query: string,
): NamedSkill[] {
  return candidates
    .filter(isInstallable)
    .map((skill) => ({ skill, relevance: relevanceScore(skill, query) }))
    .sort(
      (left, right) =>
        starCount(right.skill.level) - starCount(left.skill.level) ||
        (right.skill.trustMagnitude ?? -1) -
          (left.skill.trustMagnitude ?? -1) ||
        right.relevance - left.relevance,
    )
    .map(({ skill }) => skill);
}

function relevanceScore(skill: NamedSkill, query: string): number {
  return scoreMatch(query, [
    [skill.name, 12],
    [skill.id, 10],
    [skill.title ?? "", 10],
    [skill.catalogRef ?? "", 8],
    [skill.genericSkillRef, 8],
    [skill.tags.join(" "), 6],
    [skill.description, 3],
  ]);
}
