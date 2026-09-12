# Agent instructions

Read `README.md` and `DEPRECATION.md` before changing this repository. This
repository is deprecated in favor of the bundled Skill Heaven plugin, but its
published packages remain installable; do not start new product work here or
pretend the deprecated package is the current plugin surface.

## Organization dogfooding and feedback

Prefer the in-house Skill Heaven Agent Plugin or its actual supported Skills
API surface when a genuine task need makes it relevant and the current harness
makes it available. Native skills or the normal workflow may be a fallback when the in-house
surface is unavailable **or lacks a relevant usable skill**; fallback does not
count as Skill Heaven validation. This preference never overrides an explicit
user invocation or a repository-required project skill. There
is no skill quota: do not summon gratuitously, invent registration commands,
pretend a client supports an unavailable surface, silently install anything, or
edit user-global configuration. `/summon` is one-session context, not a
permanent installation; preserve zero posture and human intent. If this
repository's existing `summon` package surface is relevant, report its actual
behavior rather than treating it as the portable plugin.

When friction appears during relevant real work or human feedback, capture a
minimal local note immediately or as soon as practical. The exclusion list for
public reports applies to capture as well as output: do not record raw prompts,
transcripts, session logs, credentials, access tokens, raw tokenized content,
personal data, private code, private URLs or paths, customer identifiers, or
confidential details unnecessarily. Redact or synthesize before any external
search query or delegate handoff. Store minimal drafts outside repository
worktrees in caller-controlled local scratch. If uncertain, keep a constrained
local note and ask the owner; do not export it. At task end, review pending notes;
process only new actionable friction. Keep expected versus
observed behavior, repo/commit, harness/version, route/source when known, a safe
reproduction, impact, and evidence separate from inference. Identify
human-reported facts as such. Retrieval score, retrieval rank, materialization, and exit code
are not behavioral success or task outcome. Do not alter existing selection
policy, labels, evidence semantics, or curator gates.

Classify friction honestly as an unsupported client, unavailable configuration,
documented coverage limit, no-match, usability friction, or suspected defect.
Check the documented version and surface, and deduplicate known limits. Absence,
zero entries, or a no-match alone does not prove regression or intrinsic
uninstallability; known coverage limits are not by themselves defects. A new
actionable UX consequence may still be filed as feedback without asserting a bug.
Only observed Skill Heaven plugin, `/summon`, or existing `SKILL.md` Skills API
usability or capability friction belongs in this feedback loop. Repo-local tooling
issues follow existing repository filing rules; do not reroute Tree CLI preflight
issues into Skill Heaven.

If the pending note is actionable and in that Skill Heaven scope, use the
smallest light-agent capability that the current harness safely supports to
deduplicate/search and prepare one sanitized, approval-ready issue in
`gaia-research/gaia-skill-heaven`; only file it when the owner has authorized
this narrow safe-feedback action and no repository-required approval gate blocks
it. The issue writer **MUST NOT** launch another issue writer or restart the
feedback loop. Deduplicate before publication using the already-sanitized
packet; process only one new actionable case, aggregate one underlying problem,
and link an existing issue when appropriate. Dispatch must respect active worker
limits, explicit no-delegation instructions, and repository-specific approval
gates. Public reports must use a synthetic minimal reproduction and exclude raw
prompts, transcripts, session logs, credentials, access tokens, raw tokenized
content, personal data, private code, private URLs or paths, customer
identifiers, and confidential details. This narrow filing authorization is not
a general exception to per-action approval for other public or irreversible
actions; explicit repository-mandated approval gates always apply. If privacy,
auth, tooling, or an approval gate blocks safe filing, save a local draft outside
the repository worktree and report that honestly; do not bootstrap another
harness or override a gate. Use only labels known to exist.

Use existing optional caller-controlled local telemetry only when the current
surface supports it; no upload, full-transcript capture, daemon, autonomous
issue flood, or automatic policy, floor, gold, or tuning changes. If an aggregate cost or token figure is
included, it must come from canonical `gaia-research/skill-cost` with provenance,
not a UI or model self-report; otherwise omit it and do not collect extra data
for that purpose. Standalone
`skill-*` repos, archived/forks, Milim/apps/pets, `marketing-tasks`, and private
`.github` repos are exempt. The owner/orchestrator reviews and merges policy
PRs; do not merge your own.
