# Skill Hell — summon engine (prototype)

Status: **prototype, in progress.** Program 3, EPIC gaia-skill-tree#1336.

## What this is

Skill Hell is the high-entropy end of the Skill Heaven ladder. Where Skill Heaven
*subtracts* context to reach a clean floor, Skill Hell *adds* it — summoning skills
from the live Gaia registry into the running session on demand.

This document tracks the summon engine that lives in `gaia-mcp`.

## Product shape

`/skill-hell <intent>` →
1. query the live Gaia Registry and rank matching, installable Named Skills (star level first, then Trust Magnitude — still untuned)
2. resolve each winner's `links.github` into a repository, branch, and skill subpath
3. shallow-clone the repository into the session's cache, or pull an existing valid cache
4. validate that the subpath is a directory containing `SKILL.md`
5. recursively copy the **whole skill directory** — `SKILL.md` plus `reference/`, `scripts/`, fixtures, and other supporting files — into the **session-locked temp directory**
6. recursively install every `suiteComponents` entry, including nested suites, and install a suite root's own source when it has one
7. record the materialized skill, content hash, cache state, and timings in `session.json`, then report what was summoned

The session root is disposable. It contains both the repository cache and the
materialized `skills/` directories; no user configuration is changed.

## Install parity

`/Users/marcotiongson/gaia-skill-tree/src/gaia_cli/install.py` is the canonical
reference for install behavior. Skill Hell mirrors these semantics:

- GitHub `blob`, `tree`, and bare-repository URL parsing.
- Shallow, single-branch clone; `git pull` for a valid cached repository; and
  removal/re-clone repair for a partial cache or failed pull.
- Registry-only and missing-source guards, source-subpath validation, and the
  requirement that the resolved directory contain `SKILL.md`.
- Whole-directory materialization rather than a single-file fetch.
- Recursive `suiteComponents`, a visited set for cycle safety, suite failure when
  any component fails, explicit failed component IDs, and direct installation of
  a suite root's own `links.github` source without re-entering the suite path.

The following canonical CLI behavior is **not ported**: local/global install
locations, symlink/junction creation, `.gaia/install-manifest.json`, update and
uninstall commands, and cleanup of installations when their location changes.
Skill Hell uses a disposable session root and copies files instead. It also
records a `sha256` for the materialized `SKILL.md`, but deliberately does not
verify that hash or use it as an admission gate. The canonical `ultimate`
prerequisite fallback is not implemented; only explicit `suiteComponents` are
expanded.

## Timing

Each materialized skill records `cloneSeconds`, `materializeSeconds`,
`totalSeconds`, and `cacheState` (`"cold"` or `"warm"`) in `session.json` and
in `--json`/`gaia_summon` results. `cloneSeconds` measures cloning or updating
the repository; `materializeSeconds` measures copying the skill directory;
`totalSeconds` is the end-to-end skill install measurement. Each summon
invocation also reports a run-level `totalSeconds`.

Values are seconds at millisecond precision. Cold and warm runs are different
measurements — a cold clone and a warm cache reuse must never be averaged
together.

## Why it lives here

`gaia-mcp` already owns registry access: `gaia_search`, `gaia_inspect`, `gaia_status`,
live-fetching `gaiaskilltree.com/graph/*` with a 5-minute in-memory cache. The summon
engine is the first *write* path in this repo.

## Constraints

- **Session-locked.** Everything materializes under one temp root, removed on session end.
- **Never mutates user config.** No writes outside the session root.
- **Untuned ranking.** Prefer higher-rated, but no learned weighting. Benchmarks come later.
- **Read-only registry.** The summon path never writes back to the Tree.

## Not in scope yet

Benchmarks (Hell/Heaven Index scoring), routing eligibility, content-hash admission gates.
