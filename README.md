> [!WARNING]
> **DEPRECATED.** This package is superseded by the **Skill Heaven Claude Code
> plugin**, which bundles the summon MCP server directly — nothing to install
> separately. See
> [`gaia-research/gaia-skill-heaven`](https://github.com/gaia-research/gaia-skill-heaven).
>
> The engine that used to live in this repo now lives at `packages/skill-summon`
> in that monorepo, and ships esbuild-bundled straight into the plugin
> (`plugins/skill-heaven/mcp/skill-summon.mjs`) — no npx, no sibling checkout,
> no external binary, no runtime dependencies.
>
> **The published packages stay installable.** `@gaia-research/mcp` and
> `skill-hell` are not being unpublished — existing `install.sh` copies and
> version-pinned installs keep working. Deprecated means *don't start new work
> here*, not *it broke*. New work should target the plugin instead.
>
> See [`DEPRECATION.md`](DEPRECATION.md) for the full closeout notes, including
> the pending `npm deprecate` steps.

# Gaia MCP

Agent-native Gaia Registry discovery, evidence inspection, and temporary skill
summoning for [Gaia Skill Tree](https://github.com/gaia-research/gaia-skill-tree).

> **Status:** [`@gaia-research/mcp@0.4.0`](https://github.com/gaia-research/gaia-mcp/releases/tag/mcp-v0.4.0)
> is published. It is a working prototype: its current package interface is
> usable, while later Heaven/Summon profile work remains separate.

Gaia MCP consumes public Registry data; it does not own or mutate the Registry.

## Current package surface

The published **rich Registry/Bond package surface** has four tools:

| Tool | Current purpose |
|---|---|
| `gaia_search` | Find generic and Named Skills by task and constraints. |
| `gaia_inspect` | Return an evidence-backed skill dossier. |
| `summon` | Materialize matching Named Skills into an ephemeral Skill Hell session. |
| `gaia_status` | Report version, Registry freshness, compatibility, counts, and available tools. |

`summon` is the current tool name; `gaia_summon` is not a current package tool.
It materializes skills in a temporary session and may maintain a bounded,
temporary cross-session payload cache. It never changes the Registry, current
repository, or permanent harness/project configuration.

### Package surface versus the thin Heaven/Summon profile

The package's four tools are **not** an implementation or measurement of D4's
thin, two-tool Heaven/Summon profile (`search_skills`, `summon`). The latter is
a profile and schema-dose constraint for Skill Heaven work. It does not rename,
remove, or deprecate any of the published package tools above.

## Install and run

Requires Node.js 22.14 or newer.

### Add the MCP server to Claude Code

Use an explicit package selector and binary. `@gaia-research/mcp` registers two
binaries, so a package name alone cannot select the MCP server:

```sh
claude mcp add gaia -- npx --yes --package=@gaia-research/mcp@latest gaia-mcp
```

For another MCP client, use this command and argument shape:

```json
{
  "command": "npx",
  "args": ["--yes", "--package=@gaia-research/mcp@latest", "gaia-mcp"]
}
```

### Summon from a clean shell

The npx-friendly alias is the shortest one-shot command:

```sh
npx --yes skill-hell@latest summon "code review" --card
```

You can also select the `skill-hell` binary directly from the rich package:

```sh
npx --yes --package=@gaia-research/mcp@latest skill-hell summon "code review" --card
```

For a persistent shell installation, install the rich package and use either of
its two binaries:

```sh
npm install --global @gaia-research/mcp@latest
gaia-mcp
skill-hell summon "code review" --card
```

`skill-hell@latest` is an alias package with its own forwarding binary. The
scoped package deliberately exposes both `gaia-mcp` and `skill-hell`; always
select the intended binary with `--package` when running it through npx.

## Run from a checkout

```sh
npm ci
npm run build
node dist/bin/gaia-mcp.js
```

The server speaks MCP over stdio, so it normally appears idle when run directly.
Connect an MCP client to the absolute path of `dist/bin/gaia-mcp.js`.

For isolated source testing, override the public projection endpoints with
`TREE_URL` and `TREE_NAMED_URL`.

## Skill Hell sessions

`summon` materializes the whole skill directory — `SKILL.md` plus referenced
files, templates, scripts, and fixtures — under an ephemeral session root. It
returns cards, inspect links, timing, cache state, and its ranking disclosure.

```sh
skill-hell summon "code review" --count 3
skill-hell sessions
# Re-attach in a new shell/session:
eval "$(skill-hell attach skill-hell-AbCd12)"
```

`--count` is bounded to 1–5. Named Skills may publish an open `trust` object;
when there is no comparable signal, the result explicitly reports
relevance-only ordering. This per-invocation ordering is not Hell/Heaven
scoring, routing eligibility, or a content-hash admission policy. Those
features are not shipped.

Warm roots remain under `os.tmpdir()` for the configured TTL. `skill-hell`
never writes into the current repository, `~/.claude`, or permanent skill
configuration.

## Verify

```sh
npm run check       # format check, typecheck, unit/protocol/package tests
npm run test:live   # current Gaia public-data contract
npm pack --dry-run  # publishable artifact contents
```

## Reference documents

- [Compatibility](COMPATIBILITY.md)
- [Versioning and releases](VERSIONING.md)
- [Skill Hell prototype details](docs/SKILL-HELL.md)
- [Changelog](CHANGELOG.md)
- [Gaia MCP releases](https://github.com/gaia-research/gaia-mcp/releases)

## Non-goals

Gaia MCP is not:

- a second Registry implementation;
- a direct Registry or Skill Tree mutation path;
- a permanent skill installer or background update daemon;
- an implemented Hell/Heaven scoring, routing-eligibility, or content-hash
  admission system;
- the thin Heaven/Summon profile merely because it has a `summon` tool.

## License

[MIT](LICENSE)
