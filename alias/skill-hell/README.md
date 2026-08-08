# skill-hell

> **WORKING PROTOTYPE — actively tested for public use, not a finished product.**
> Interfaces and command surfaces may change.

Summon a skill into your session instead of installing it.

```sh
npx skill-hell summon "code review" --card
```

```
[Summoned] QA
  ID: garrytan/qa
  Trust: Level 3★ · Trust Magnitude 63.73 · Overall Trust Grade B
  Ranking: trust then relevance — level, trustMagnitude
  Install: 3.414s · cold/remote · 4 files
  Path: /tmp/skill-hell-kbAV31/skills/garrytan__qa
  Inspect: https://github.com/garrytan/gstack/blob/main/qa/SKILL.md
```

The whole skill directory is materialized — `SKILL.md` plus its `references/`,
`templates/`, and scripts — into a **session-scoped** root under your OS temp dir.
Nothing is written to your repository and nothing to `~/.claude`. The session root
stays warm, so a later session re-attaches instead of re-cloning.

## Commands

```sh
skill-hell summon "<intent>" [--count N] [--card | --json]
skill-hell list [--json]
skill-hell sessions [--json]
skill-hell attach <session-id|name|root> [--json]
skill-hell path [--json]
skill-hell close [--json]
skill-hell gc [--dry-run] [--json]
```

Point it at a different tree with `TREE_URL`. Trust fields are whatever that tree
publishes — a tree with no star rating or trust score ranks by relevance and says so,
rather than silently returning arbitrary order.

## What this package is

A **name alias**, and nothing else — one dependency and this README. It ships no code.

The engine lives in [`@gaia-research/mcp`](https://www.npmjs.com/package/@gaia-research/mcp),
which ships two binaries — `gaia-mcp` and `skill-hell`. npx runs the binary matching the
*package* name, and neither matches, so:

```
$ npx @gaia-research/mcp
npm error could not determine executable to run
```

The working-but-non-obvious form is `npx -y -p @gaia-research/mcp skill-hell`. This package
exists so the obvious command is also the correct one.

There is deliberately **no wrapper binary here**. Installing this package puts the engine's
own `skill-hell` on `PATH` via the dependency, so `npx skill-hell` reaches the real binary
directly — no extra process, no argv or signal forwarding to get wrong. An earlier draft of
this package shipped a wrapper; testing showed npm links the dependency's bin regardless,
which made the wrapper dead code. It was removed rather than published unused.

If you are installing rather than one-shotting, prefer the engine directly:

```sh
npm install -g @gaia-research/mcp
```

## The other half

`skill-hell` is the additive half of the Skill Heaven entropy ladder. The subtractive
half — launchers that boot your agent with *less* rather than more — is at
[gaia-research/skill-heaven](https://github.com/gaia-research/skill-heaven), installable
in one command:

```sh
curl -fsSL https://gaia-research.github.io/skill-heaven/install.sh | sh
```
