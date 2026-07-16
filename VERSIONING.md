# Versioning and Releases

Gaia MCP uses independent [Semantic Versioning](https://semver.org/). Its
version is never locked to Gaia Skill Tree, `gaia-cli`, the public-data version,
or the Gaia Research website.

## Version line

- `0.1.x` — read-only Registry discovery and inspection;
- `0.2.x` — Bonded local context;
- `0.3.x` — guarded actions;
- `0.4.x` — canonical consumer migrations and retirement of duplicates;
- `1.0.0` — stable tool names, result schemas, compatibility policy, and
  deprecation guarantees.

Pre-release tags use standard SemVer identifiers:

- `v0.1.0-alpha.1` for incomplete integration builds;
- `v0.1.0-beta.1` for feature-complete client testing;
- `v0.1.0-rc.1` for release candidates.

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

1. a protected-workflow git tag `vX.Y.Z`;
2. a GitHub Release with compatibility table and migration notes;
3. an npm package with exactly the same version;
4. a generated software bill of materials;
5. test evidence for build, protocol, clean install, and supported contract
   fixtures;
6. a changelog entry.

The intended npm package is `@gaia-research/mcp`. It must use npm provenance and
trusted publishing when implementation begins. Long-lived npm tokens are not
part of the release design.

## Release automation

The repository uses Release Please with Conventional Commits:

1. merges to `main` update a reviewable release pull request;
2. the release workflow runs unit, protocol, stdio, live-contract, build, and
   clean-package gates before it allows a tag;
3. merging the release pull request updates `package.json`, `src/version.ts`,
   and this changelog, then creates the protected-workflow tag and GitHub
   Release;
4. npm publishes from the GitHub-hosted `release.yml` workflow using OIDC;
5. the workflow attaches a CycloneDX SBOM to the GitHub Release.

The runtime version is kept in `src/version.ts`; Release Please updates it via
the `x-release-please-version` marker alongside `package.json`.

Trusted publishing requires the package to exist first. The first release uses
one short-lived `NPM_BOOTSTRAP_TOKEN` from the same GitHub-hosted workflow so it
still receives provenance. Immediately afterward, the maintainer configures
the npm trusted publisher, deletes the GitHub secret, and revokes the token.
All subsequent releases are tokenless.

`COMPATIBILITY.md` is the version-line source of truth. The release workflow
appends it to the generated GitHub Release notes before npm publication. A
release with breaking changes must also include explicit migration notes in its
Conventional Commit body so Release Please carries them into the changelog.

## Release gate

A tag is created only after:

- tests pass on the minimum and current supported Node versions;
- a clean packed artifact starts through stdio;
- at least one current Gaia Registry query succeeds;
- compatibility fixtures pass;
- action releases pass fail-closed and approval tests;
- documentation names any deprecations or operator steps.

For the first publication, the Gaia Research exact-version consumer test runs
after npm makes `v0.1.0` installable. It gates website “available” claims,
legacy-document replacement, and v0.1 milestone closure. If that downstream
test fails, publish a corrective patch and deprecate the broken npm version when
appropriate; never publish an untested installation command.

The `v0.1.0` implementation is under review and has no published package or
release yet. The first public release will be `v0.1.0`.
