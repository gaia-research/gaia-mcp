# Publishing `skill-hell`

This package has never been published. The name is **available** on npm (verified 404 on
`npm view skill-hell`), and since `skill-hell` is a product name worth holding, claiming it
has value beyond the npx ergonomics.

Publishing it is a **founder action**. It is not wired into `release.yml`, deliberately:
npm trusted publishing (OIDC) is configured per package, and a package that does not exist
yet has no publisher to trust.

## First publish

1. Publish once manually, from this directory, as a user with rights to the name:

   ```sh
   cd alias/skill-hell
   npm publish --access public
   ```

2. On npmjs.com, configure the package's **trusted publisher** to
   `gaia-research/gaia-mcp` → workflow `release.yml`, environment `npm` — matching how
   `@gaia-research/mcp` is already set up.

3. Only then wire it into `release.yml`, so releases stay OIDC-published with no token.

## Version discipline

`dependencies` pins `@gaia-research/mcp` to an **exact** version, not a range. This package
is a pointer at a specific engine release; a floating range would let `npx skill-hell`
silently resolve to an engine this pointer was never tested against.

That means the two versions move together. When the engine releases, bump this package's
`version` and its pinned dependency to match, in the same PR.

## Why there is a `bin/skill-hell.mjs` shim

`npm install skill-hell` does link the dependency's `skill-hell` binary into `.bin` — that
part was never in question. But `npx skill-hell` (and `npm exec skill-hell`) with nothing
pre-installed is a different code path: npm decides what to run by reading the *requested*
package's own `bin` field (`libnpmexec/get-bin-from-manifest.js`), not a hoisted
dependency's. `skill-hell` had no `bin` field of its own, so cold `npx skill-hell` failed
with `could not determine executable to run` — verified against the published
`skill-hell@0.3.0` tarball.

An earlier draft shipped a forwarding shim and it was deleted as dead code; that
conclusion was reached by testing via `npm exec -- skill-hell ...` from inside a directory
that already had the package `npm install`ed, which resolves the local `.bin` entry
directly and never exercises manifest-bin lookup either way — so the shim's absence never
showed up. The true cold path (no prior install — the entire advertised `npx skill-hell`
UX) was never actually tested.

`bin/skill-hell.mjs` resolves `@gaia-research/mcp`'s installed location via
`import.meta.resolve` and dynamically imports its real `dist/bin/skill-hell.js`, so this
package still ships no CLI logic of its own — just enough indirection for npm's bin
resolution to find something to run.

Verified against a packed tarball, `npx --package=<tarball> -- skill-hell --help` (the
same manifest-bin-lookup path a real cold `npx skill-hell` takes) now resolves and forwards
correctly.
