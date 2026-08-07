# Gaia MCP

Agent-native discovery, trust, installation, and progression for the
[Gaia Skill Tree](https://github.com/gaia-research/gaia-skill-tree).

> **Status:** the `v0.1.0` Trusted Discovery implementation is under review.
> The npm package is not published yet; use the local development instructions
> below until the first release passes its publication gate.

Gaia MCP lets an AI agent answer a practical question inside the user's current
conversation:

> Which evidence-backed skill fits this task, why should I trust it, and can you
> add it to this workspace safely?

It is a standalone Gaia Research instrument. It consumes canonical public data
and validated local actions from Gaia Skill Tree; it does not own or mutate the
Registry directly.

## Repository roles

| Repository | Responsibility |
|---|---|
| [`gaia-skill-tree`](https://github.com/gaia-research/gaia-skill-tree) | Canonical Registry, schemas, public data, Trust Magnitude, and validated CLI actions. |
| [`gaia-research`](https://github.com/gaia-research/gaia-research) | Human-facing portal, research, reports, and the future Gaia MCP product page. |
| **`gaia-mcp`** | Agent-facing discovery, comparison, recommendation, installation coordination, and progression guidance. |
| [`skill-fuse`](https://github.com/gaia-research/skill-fuse) | Creative authoring: combines installed skills into a new `SKILL.md`. |
| [`gaia-operator`](https://github.com/gaia-research/gaia-operator) | Guarded browser and platform interaction runtime. |

## v0.1 tool surface

- `gaia_search` — find generic and Named Skills by task and constraints.
- `gaia_inspect` — return an evidence-backed skill dossier.
- `gaia_status` — report server compatibility, Registry freshness, counts, and
  source URLs.
- `summon` — materialize matching skills into an ephemeral Skill Hell session,
  with printable cards, inspect links, and explicit ranking provenance.

The first three tools are implemented in read-only Registry mode for `v0.1.0`.
`gaia_analyze_project` and `gaia_plan_path` arrive with Bonded mode in `v0.2.0`.

Installation, updates, and Intake submission arrive only after the read-only
surface is trustworthy. Every action will route through the canonical Gaia CLI
and require explicit approval where it changes the workspace or external state.

## Run the development server

Requires Node.js 22.14 or newer.

```sh
npm ci
npm run build
node dist/bin/gaia-mcp.js
```

The server speaks MCP over stdio, so it normally appears idle when run directly.
Connect it from an MCP client using the absolute path to
`dist/bin/gaia-mcp.js`.

After `v0.1.0` is published and its clean-install gate passes, the canonical
Claude Code installation will be version-pinned:

```sh
claude mcp add gaia -- npx -y @gaia-research/mcp@0.1.0
```

Do not use that npm command until the package appears in the
[Gaia MCP releases](https://github.com/gaia-research/gaia-mcp/releases).

The public projection endpoints can be overridden for testing with
`TREE_URL` and `TREE_NAMED_URL`.

## Ambient Skill Hell

The standalone CLI can summon one or several relevant skills without changing the
current repository or user configuration:

```sh
skill-hell summon "code review" --card
skill-hell summon "code review" --count 3
skill-hell sessions
# Re-attach in a new shell/session:
eval "$(skill-hell attach skill-hell-AbCd12)"
```

`--count` is bounded to 1–5. Every JSON result includes the result card, human-openable
`inspectUrl`, install timing paired with `cold`/`warm`, and a ranking disclosure. Named
skills may publish an open `trust` object whose keys display automatically. Numeric
values—or descriptors such as `{ "value": "aurora", "score": 9 }`—can rank candidates;
when no comparable trust signal exists, summon explicitly reports relevance-only
ranking. Gaia's existing `level`, `trustMagnitude`, and `overallTrustGrade` remain
back-compatible aliases and are adapted into the open bag.

Warm roots remain under `os.tmpdir()` for the configured TTL. `skill-hell sessions`
lists them and `skill-hell attach` emits the `SKILL_HELL_SESSION` export needed to reuse
already-materialized payloads. Skill Hell never writes into the current repository,
`~/.claude`, or permanent skill configuration.

## Verify

```sh
npm run check       # typecheck, unit/protocol tests, build
npm run test:live   # current gaiaskilltree.com data contract
npm pack --dry-run  # publishable artifact contents
```

## Design documents

- [Architecture](ARCHITECTURE.md)
- [Delivery roadmap](ROADMAP.md)
- [Versioning and releases](VERSIONING.md)
- [Compatibility](COMPATIBILITY.md)
- [Changelog](CHANGELOG.md)

## Cross-repository tracking

- [`gaia-mcp` v0.1 implementation and release](https://github.com/gaia-research/gaia-mcp/issues/1)
- [Founder npm bootstrap and trusted-publisher handoff](https://github.com/gaia-research/gaia-mcp/issues/2)
- [Gaia Skill Tree extraction and Roadmap v5 RFC](https://github.com/gaia-research/gaia-skill-tree/issues/1191)
- [Gaia Research website integration and consumer test](https://github.com/gaia-research/gaia-research/issues/53)

## Non-goals

Gaia MCP is not:

- a conversational wrapper around every `gaia` command;
- a second Registry implementation;
- the engine that creatively fuses `SKILL.md` files;
- a direct Registry or Skill Tree mutation path;
- a background update daemon;
- part of the Gaia Research website runtime.

## License

[MIT](LICENSE)
