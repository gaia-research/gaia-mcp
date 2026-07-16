# Compatibility

Gaia MCP `v0.1.x` uses this release contract:

| Surface | Supported value |
|---|---|
| MCP protocol | `2025-11-25`, `2025-06-18`, `2025-03-26`, `2024-11-05`, `2024-10-07` through `@modelcontextprotocol/sdk@1.29.0` |
| Gaia public data | `gaia-public-v1` shape adapter |
| Gaia CLI machine interface | `none` — Registry mode only |
| Node.js | `>=22.14.0` |
| Transport | stdio |

The current Gaia public projections do not declare their own contract version.
`gaia-public-v1` therefore names this repository's validated adapter contract,
not an upstream version claim. Gaia MCP rejects an incompatible advertised
version, rejects incomplete projections, and reports the unversioned upstream
state as a warning in every tool result.

Stale but structurally consistent data remains queryable with its age and a
regeneration warning. Missing required fields, empty projections, unsupported
advertised versions, and dangling Named-to-generic references fail closed.
