# Deprecation

`gaia-mcp` (published as `@gaia-research/mcp` and its npx-friendly alias
`skill-hell`, both currently at `0.4.0`) is **deprecated in favor of the
Skill Heaven Claude Code plugin**.

## What happened

The MCP server this repo publishes has been ported in-repo to the Skill
Heaven monorepo, [`gaia-research/gaia-skill-heaven`](https://github.com/gaia-research/gaia-skill-heaven),
as `packages/skill-summon`, and esbuild-bundled directly into the Claude Code
plugin at `plugins/skill-heaven/mcp/skill-summon.mjs`. The plugin ships its
own server: no npx, no sibling checkout, no external binary, no runtime
dependencies. That supersedes what this repo publishes.

## What does *not* change

- **Nothing is unpublished.** `@gaia-research/mcp` and `skill-hell` remain
  installable on npm at their current versions. Existing `install.sh` copies,
  pinned installs, and anything already depending on these packages keeps
  working exactly as before.
- **This repository is not archived or deleted.** The code, issues, and
  history stay available for reference.
- Deprecated means *don't start new work here* — not *it broke*.

## Outstanding: `npm deprecate`

The remaining step is marking both npm packages deprecated so `npm install`
prints a pointer to the plugin. This needs npm publish credentials for the
`gaia-research` org, which the agent that wrote this file does not have
(`npm whoami` returns 401 in this environment). Whoever holds the token should
run:

```sh
npm deprecate @gaia-research/mcp "Deprecated: superseded by the Skill Heaven Claude Code plugin, which bundles this MCP server directly. See https://github.com/gaia-research/gaia-skill-heaven"

npm deprecate skill-hell "Deprecated: superseded by the Skill Heaven Claude Code plugin, which bundles this MCP server directly. See https://github.com/gaia-research/gaia-skill-heaven"
```

Both commands only set the npm registry's deprecation notice (shown on every
`npm install` / `npm view`) — they do not unpublish, remove, or modify any
package contents, and they are reversible with `npm deprecate <pkg> ""`.

Nothing else is required for the deprecation itself; this document, together
with the banners on the root and alias `README.md`, is the rest of the
closeout.
