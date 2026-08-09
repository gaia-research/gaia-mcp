# Compatibility

## Published release contract

[`@gaia-research/mcp@0.4.0`](https://github.com/gaia-research/gaia-mcp/releases/tag/mcp-v0.4.0)
uses this release contract. Public installation guidance uses `@latest`; 0.4.0
is the release currently behind that tag at this document's update.

| Surface | Supported value |
|---|---|
| Package tools | `gaia_search`, `gaia_inspect`, `summon`, `gaia_status` |
| MCP protocol | `2025-11-25`, `2025-06-18`, `2025-03-26`, `2024-11-05`, `2024-10-07` through `@modelcontextprotocol/sdk@1.29.0` |
| Gaia public data | `gaia-public-v1` shape adapter |
| Gaia CLI machine interface | `none` — the current package uses Registry mode |
| Node.js | `>=22.14.0` |
| Transport | stdio |

The public projections do not declare their own contract version.
`gaia-public-v1` names this repository's validated adapter contract, not an
upstream version claim. Gaia MCP rejects incompatible advertised versions and
incomplete projections, and reports unversioned upstream state as a warning.

Stale but structurally consistent data remains queryable with its age and a
regeneration warning. Missing required fields, empty projections, unsupported
advertised versions, and dangling Named-to-generic references fail closed.

## Tool-profile boundary

These four tools are the current rich Registry/Bond package interface.
D4's `search_skills` + `summon` thin Heaven/Summon profile is a distinct
future/profile constraint, not a replacement name for the package surface.
In particular, the current tools are not deprecated by that profile, and
`summon` is the current package name rather than `gaia_summon`.

`summon` can create temporary session files, but it does not mutate the Gaia
Registry or persistent user configuration. Hell/Heaven scoring, routing
eligibility, and content-hash admission or verification are not part of this
release contract.
