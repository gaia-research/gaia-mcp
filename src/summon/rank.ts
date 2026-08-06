import { isInstallable, scoreMatch, starCount } from "../service.js";
import type { NamedSkill } from "../domain/types.js";

/**
 * Untuned ranking: no learned weighting, just a fixed sort order. Good
 * enough to pick a plausible winner today; real relevance benchmarks come
 * later.
 *
 * Relevance GATES, rating ORDERS. A candidate that does not match the query
 * at all is dropped before rating is considered — otherwise the single
 * highest-rated skill in the registry wins every query regardless of what
 * was asked for, which is what "prefer higher-rated" must not mean.
 * Among candidates that do match, the higher-rated one wins.
 *
 * Uninstallable candidates are filtered out entirely — they can never be
 * summoned regardless of rank.
 */
/**
 * A lone half-weight substring hit in a description is not a match — it is
 * noise. `scoreMatch` awards weight/2 for any substring occurrence, so a
 * bare `> 0` test admits nearly the whole registry. Require enough signal
 * that at least one weighted field genuinely matched.
 */
const MIN_RELEVANCE = 6;

/**
 * Candidates within this fraction of the best relevance score are treated as
 * equally on-topic, and rating decides between them. Below it, the candidate
 * is off-topic enough that no amount of rating should rescue it.
 */
const RELEVANCE_BAND = 0.5;

export function rankCandidates(
  candidates: readonly NamedSkill[],
  query: string,
): NamedSkill[] {
  const scored = candidates
    .filter(isInstallable)
    .map((skill) => ({ skill, relevance: relevanceScore(skill, query) }))
    .filter(({ relevance }) => relevance >= MIN_RELEVANCE);

  if (scored.length === 0) return [];

  const best = Math.max(...scored.map(({ relevance }) => relevance));
  const onTopic = scored.filter(
    ({ relevance }) => relevance >= best * RELEVANCE_BAND,
  );

  return onTopic
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
