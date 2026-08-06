# Skill Hell — summon engine (prototype)

Status: **prototype, in progress.** Program 3, EPIC gaia-skill-tree#1336.

## What this is

Skill Hell is the high-entropy end of the Skill Heaven ladder. Where Skill Heaven
*subtracts* context to reach a clean floor, Skill Hell *adds* it — summoning skills
from the live Gaia registry into the running session on demand.

This document tracks the summon engine that lives in `gaia-mcp`.

## Product shape

`/skill-hell <intent>` →
1. query the live Gaia registry for skills matching the intent
2. prefer higher-rated skills (star level first, then Trust Magnitude) — untuned ranking
3. fetch the winning `SKILL.md` from its `links.github` source
4. materialize it into a **session-locked temp directory**
5. report which skill was summoned

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
