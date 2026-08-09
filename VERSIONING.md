# Versioning and Releases

Gaia MCP uses independent [Semantic Versioning](https://semver.org/). Its
version is never locked to Gaia Skill Tree, `gaia-cli`, a public-data version,
or the Gaia Research website.

## Current published line

[`@gaia-research/mcp@0.4.0`](https://github.com/gaia-research/gaia-mcp/releases/tag/mcp-v0.4.0)
was published on 2026-08-08. The current rich package surface is
`gaia_search`, `gaia_inspect`, `summon`, and `gaia_status`; see
[COMPATIBILITY.md](COMPATIBILITY.md) for the release contract.

The npx-friendly `skill-hell@0.4.0` alias is also published. It is a separate
package with its own `skill-hell` binary; the rich package itself registers the
two binaries `gaia-mcp` and `skill-hell`.

Public commands use `@latest` and select a binary explicitly:

```sh
# MCP server
npx --yes --package=@gaia-research/mcp@latest gaia-mcp

# One-shot Skill Hell alias
npx --yes skill-hell@latest summon "code review" --card
```

## Historical planning labels

The original roadmap used these planning labels:

- `0.1.x` — trusted discovery;
- `0.2.x` — Bonded local-context target;
- `0.3.x` — guarded-actions target;
- `0.4.x` — canonical-consumer target;
- `1.0.0` — stable tool names, result schemas, compatibility policy, and
  deprecation guarantees.

They are retained as planning history, not as a feature inventory for a
published version. The current package contract is the four-tool 0.4.0 surface
above. In particular, a future thin Heaven/Summon profile does not retroactively
rename or deprecate the package's Registry/Bond tools.

Pre-release tags use standard SemVer identifiers such as
`vX.Y.Z-alpha.1`, `vX.Y.Z-beta.1`, and `vX.Y.Z-rc.1`.

## Compatibility contract

Every release records:

| Field | Meaning |
|---|---|
| MCP protocol compatibility | Protocol date/version exercised by tests. |
| Gaia public-data range | Supported public projection contract versions. |
| Gaia CLI machine range | Supported local machine-interface versions, or `none` for Registry-only releases. |
| Node range | Supported runtime versions. |
| Transports | Supported MCP transports. |

The server exposes these values through `gaia_status` and diagnostic output.

## Breaking changes

Before `1.0.0`, a minor version may contain breaking changes, but release notes
must name each one and provide migration instructions.

From `1.0.0`, these require a major version:

- removing or renaming a tool;
- changing required tool inputs incompatibly;
- removing or renaming structured result fields;
- changing approval semantics for state-changing actions;
- dropping a previously supported Gaia contract without the documented
  deprecation window.

Adding an optional input, adding a result field, improving ranking without
changing the contract, and adding a new tool are minor changes. Compatible bug
and security fixes are patch changes.

## Release artifacts

Every public release must produce:

1. a workflow-generated component tag and GitHub Release (for example,
   `mcp-vX.Y.Z`);
2. a compatibility table and migration notes in that release;
3. an npm package with exactly the same version;
4. a generated software bill of materials for the rich package;
5. test evidence for build, protocol, clean install, and supported contract
   fixtures;
6. a changelog entry.

The rich package is `@gaia-research/mcp`; the one-shot alias is `skill-hell`.
Both use npm provenance and trusted publishing. They are separate artifacts, so
an alias release must be checked against the engine version it declares as an
exact dependency.

## Release automation

The repository uses Release Please with Conventional Commits:

1. merges to `main` update a reviewable release pull request;
2. the release workflow runs unit, protocol, stdio, live-contract, build, and
   clean-package gates before it allows a tag;
3. merging the release pull request updates `package.json`, `src/version.ts`,
   and the changelog, then creates the component tag and GitHub Release;
4. npm publishes from the GitHub-hosted `release.yml` workflow using OIDC;
5. the rich-package workflow attaches a CycloneDX SBOM to the GitHub Release.

The runtime version is kept in `src/version.ts`; Release Please updates it via
the `x-release-please-version` marker alongside `package.json`.

`COMPATIBILITY.md` is the version-line source of truth. The release workflow
appends it to generated GitHub Release notes before npm publication. A release
with breaking changes must also include explicit migration notes in its
Conventional Commit body so Release Please carries them into the changelog.

## Release gate

A tag is created only after:

- tests pass on the minimum and current supported Node versions;
- a clean packed artifact starts through stdio;
- at least one current Gaia Registry query succeeds;
- compatibility fixtures pass;
- action releases pass fail-closed and approval tests;
- documentation names any deprecations or operator steps.

The release verification must include the explicit package-selector form for
`gaia-mcp` and a cold `skill-hell@latest` invocation. Never publish an
installation example that leaves a multi-bin scoped package without an
executable selection.
