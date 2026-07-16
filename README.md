# Gaia MCP

Agent-native discovery, trust, installation, and progression for the
[Gaia Skill Tree](https://github.com/gaia-research/gaia-skill-tree).

> **Status:** architecture baseline. The standalone server is not runnable or
> published yet. The first implementation milestone is `v0.1.0`.

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

## Planned first tool surface

- `gaia_search` — find generic and Named Skills by task and constraints.
- `gaia_inspect` — return an evidence-backed skill dossier.
- `gaia_status` — explain identity, Registry freshness, installed skills, and
  local capability state.
- `gaia_analyze_project` — map the current workspace to Gaia capabilities.
- `gaia_plan_path` — explain the path from current capabilities to a target.

Installation, updates, and Intake submission arrive only after the read-only
surface is trustworthy. Every action will route through the canonical Gaia CLI
and require explicit approval where it changes the workspace or external state.

## Design documents

- [Architecture](ARCHITECTURE.md)
- [Delivery roadmap](ROADMAP.md)
- [Versioning and releases](VERSIONING.md)

## Cross-repository tracking

- [`gaia-mcp` v0.1 implementation and release](https://github.com/gaia-research/gaia-mcp/issues/1)
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
