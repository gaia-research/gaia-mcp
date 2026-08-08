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

## Why there is no code here

npm links the dependency's `skill-hell` binary into `.bin` on install, so `npx skill-hell`
reaches the real engine with no wrapper. An earlier draft shipped a forwarding shim;
testing showed npm links the dependency's bin regardless, making the shim unreachable. It
was deleted rather than published as dead code.

Verified against a packed tarball installed into a clean directory:
`npm exec -- skill-hell summon "release notes" --card` summoned
`garrytan/document-release` (2★, TM 36) in 3.4s cold.
