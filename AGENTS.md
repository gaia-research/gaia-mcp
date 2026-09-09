# Agent instructions

Read `README.md` and `DEPRECATION.md` before changing this repository. This
repository is deprecated in favor of the bundled Skill Heaven plugin, but its
published packages remain installable; do not start new product work here or
pretend the deprecated package is the current plugin surface.

## Organization dogfooding and feedback

While doing real work in this shared repo, use an existing Skill Heaven plugin
or native skill only for a genuine task need and only when the current harness
actually provides it. There is no skill quota. Do not summon gratuitously,
pretend a client supports an unavailable surface, silently install anything,
or edit user-global configuration. `/summon` is one-session context, not a
permanent installation; preserve zero posture and human intent. If this
repository's existing `summon` package surface is relevant, report its actual
behavior rather than treating it as the portable plugin.

At task end, record only new actionable friction observed during relevant real
work or from human feedback. Keep expected versus observed behavior,
repo/commit, harness/version, route/source when known, a safe reproduction,
impact, and evidence separate from inference. Retrieval score, materialization,
and exit code are not behavioral success or task outcome. Do not alter existing selection policy, labels, evidence semantics, or curator gates.

If the current harness safely supports a light agent, use the smallest such
capability to deduplicate/search and file one issue in
`gaia-research/gaia-skill-heaven`; avoid recursive issue writers and duplicate
one underlying problem. Public reports must use a synthetic/redacted
reproduction and exclude raw prompts, transcripts, session logs, tokens,
credentials, personal data, private code, private URLs/paths, customer
identifiers, and confidential details. If safe filing is unavailable or
privacy/auth/tooling blocks it, save a local draft and report that honestly.
Use only labels known to exist.

Use existing optional caller-controlled local telemetry only when the current
surface supports it; no upload, full-transcript capture, daemon, autonomous
issue flood, or automatic policy tuning. Standalone `skill-*` repos,
archived/forks, Milim/apps/pets, `marketing-tasks`, and private `.github` repos
are exempt. The owner/orchestrator reviews and merges policy PRs; do not merge
your own.
