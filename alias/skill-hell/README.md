# skill-hell

> **WORKING PROTOTYPE — actively tested for public use, not a finished product.**
> Interfaces and command surfaces may change.

Summon a skill into an ephemeral session instead of permanently installing it.

```sh
npx --yes skill-hell@latest summon "code review" --card
```

The whole skill directory is materialized — `SKILL.md` plus its `references/`,
`templates/`, and scripts — into a session-scoped root under your OS temp
directory. Nothing is written to your repository or `~/.claude`.

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

Point it at a different tree with `TREE_URL` and `TREE_NAMED_URL`. Trust fields
are whatever that tree publishes; a tree with no comparable trust signal is
ranked by relevance and says so.

## Alias versus the rich package

[`skill-hell@0.4.0`](https://www.npmjs.com/package/skill-hell) is the
npx-friendly alias. Its own `skill-hell` binary forwards to the engine in
[`@gaia-research/mcp`](https://www.npmjs.com/package/@gaia-research/mcp).

The rich package currently registers **two** binaries:

| Package | Binaries |
|---|---|
| `@gaia-research/mcp@latest` | `gaia-mcp`, `skill-hell` |
| `skill-hell@latest` | `skill-hell` forwarding alias |

A multi-bin scoped package needs an explicit executable selection under npx.
Use the alias above, or select `skill-hell` from the rich package directly:

```sh
npx --yes --package=@gaia-research/mcp@latest skill-hell summon "code review" --card
```

For a persistent installation, install the rich package and use its binaries
from `PATH`:

```sh
npm install --global @gaia-research/mcp@latest
skill-hell summon "code review" --card
gaia-mcp
```

The current rich package surface has four tools: `gaia_search`, `gaia_inspect`,
`summon`, and `gaia_status`. `summon` is the current name, not `gaia_summon`.
The package remains a prototype: its ranking display is not Hell/Heaven scoring,
routing eligibility, or content-hash admission or verification.

## The summon axis

`skill-hell` is the explore-direction summon on the Skill Heaven Hell/Heaven
axis: it *adds* context by summoning skills into your session on demand. The
converge direction is the curated Heaven summon. The subtractive **Skill Zero**
launcher — the tool that strips context to a clean floor — lives at
[gaia-research/gaia-skill-heaven](https://github.com/gaia-research/gaia-skill-heaven).
Its documented per-harness behavior is separate from this CLI alias.
