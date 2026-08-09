# Skill Hell — summon engine (prototype)

Status: **working prototype.** [`@gaia-research/mcp@0.4.0`](https://github.com/gaia-research/gaia-mcp/releases/tag/mcp-v0.4.0)
and the npx-friendly `skill-hell@0.4.0` alias are published. The engine is not
a shipped Hell/Heaven scoring, routing-eligibility, or content-hash admission
system.

## Packages and commands

Use the alias for a one-shot summon:

```sh
npx --yes skill-hell@latest summon "code review" --card
```

The rich package registers two binaries, so select the intended one explicitly:

```sh
npx --yes --package=@gaia-research/mcp@latest skill-hell summon "code review" --card
npx --yes --package=@gaia-research/mcp@latest gaia-mcp
```

The current MCP package tools are `gaia_search`, `gaia_inspect`, `summon`, and
`gaia_status`. `summon` is the current name; `gaia_summon` is not a current
tool. D4's thin `search_skills` + `summon` Heaven/Summon profile is a separate
profile/dose constraint, not a description of this four-tool package.

## What this is

Skill Hell is the high-entropy end of the Skill Heaven ladder. Where Skill Heaven
*subtracts* context to reach a clean floor, Skill Hell *adds* it by summoning skills
from the live Gaia registry into the running session on demand.

## Product shape

`/skill-hell <intent>`:

1. query the live Gaia Registry and rank matching, installable Named Skills;
2. resolve the winner's GitHub URL and current remote commit;
3. look for that exact `repo + commit + subpath` in the bounded payload cache;
4. on a miss, make a full shallow clone inside the session, validate the subpath and
   `SKILL.md`, and copy the whole skill directory;
5. retain only the extracted payload, subject to the cache cap, and immediately delete
   the clone in a `finally` block;
6. recursively install every `suiteComponents` entry; and
7. record the skill, content hash, cache state, and timings in `session.json`.

The session root is disposable. Materialized skills live under `skills/`; `cache/` is
transient clone scaffolding and should be empty after each attempt. No user
configuration is changed.

## Tree-provided trust and ranking

Trust is optional and open-ended. A Named Skill may publish a `trust` object with any
field names. Scalar values display automatically; a descriptor may provide `value`, a
human `label`, and a numeric `score`. Numeric scalars, booleans, numeric strings, and
descriptor scores are comparable; larger scores rank first within the relevance band.
String-only fields still display but do not pretend to have ordering semantics.

Gaia's established `level`, `trustMagnitude`, and `overallTrustGrade` top-level fields
remain in JSON for existing consumers and are also adapted into the open bag. A tree
with no comparable trust fields is ranked by relevance alone, with
`ranking.mode: "relevance-only"` and an explicit disclosure in JSON and cards. New trust
keys render through generic key humanization, so adding one does not require engine or
card changes.

This ordering is local to a summon invocation. It is not a Hell/Heaven score,
routing eligibility decision, or content-hash admission or verification rule;
those capabilities are not shipped.

## Ambient result surface

- `skill-hell summon "<intent>" --card` prints one compact context-ready block per skill:
  name, available trust, ranking provenance, timing paired with cache state, file count,
  session path, and a human-openable source URL.
- JSON includes `summoned[].card`, `summoned[].inspectUrl`, the open `trust` bag, legacy
  Gaia fields, `cache`, `cacheState`, and invocation-level `ranking` and `cards`.
- `--count N` summons multiple ranked winners. The accepted range is 1–5; values outside
  it are refused rather than silently clamped. `--limit` remains a compatibility alias.

## Install parity and deliberate divergence

`/Users/marcotiongson/gaia-skill-tree/src/gaia_cli/install.py` remains the canonical
reference. Skill Hell preserves GitHub URL parsing, registry/source guards, whole
skill-directory materialization, stale-subpath checks, suite recursion, cycle safety,
and failed-component reporting.

It deliberately no longer preserves `gaia install`'s long-lived repository checkout.
A cold summon makes a shallow, single-branch clone, extracts the payload, and discards
the clone. Local/global installs, links, `.gaia/install-manifest.json`, update,
uninstall, and location migration remain out of scope. The materialized `SKILL.md`
`sha256` is recorded but deliberately **not verified or used as an admission gate**.

## Clone strategy measurements

Measured on this machine against live GitHub on 2026-08-07. Each value is one observed
run, not an average. “Warm” for discard strategies means a second invocation after the
first clone was deleted (network/OS warm only). Disk is retained disk after extraction.

| skill | approach | disk | cold | warm |
|---|---|---:|---:|---:|
| `garrytan/review` | baseline full shallow clone retained | 66.0 MiB | 2.167s | 0.720s |
|  | full shallow clone + discard | 161 KiB | 2.288s | 2.090s |
|  | partial sparse clone + discard | 161 KiB | 3.190s | 2.905s |
| `anthropic/skill-creator` | baseline full shallow clone retained | 13.7 MiB | 1.401s | 0.723s |
|  | full shallow clone + discard | 220 KiB | 1.450s | 1.486s |
|  | partial sparse clone + discard | 220 KiB | 2.567s | 2.659s |
| `vercel/find-skills` | baseline full shallow clone retained | 1.21 MiB | 1.202s | 0.811s |
|  | full shallow clone + discard | 5.3 KiB | 1.258s | 1.202s |
|  | partial sparse clone + discard | 5.3 KiB | 2.499s | 2.652s |

Sparse partial checkout reduced transient clone size from 65.8 MiB to 2.41 MiB for
`garrytan/review`, 13.5 MiB to 456 KiB for `anthropic/skill-creator`, and 1.21 MiB to
172 KiB for `vercel/find-skills`. It was nevertheless slower for every tested skill,
because clone and sparse-checkout required separate remote exchanges. Full shallow
clone + immediate discard therefore landed: it fixes accumulated disk growth and was
the faster cold path in these measurements. Sparse checkout can be reconsidered if
Git/GitHub behavior changes or transient peak disk becomes the limiting failure.

These results invalidate clone/warm timing numbers recorded before payload retention
landed. In current results, `cacheState: "warm"` means a commit-addressed payload hit,
not a retained repository followed by `git pull`; comparisons must not mix the two.

## Session garbage collection

- Every `summon` sweeps `skill-hell-*` roots in `os.tmpdir()` before registry work.
- The default expiry is 4 hours. Set `SKILL_HELL_TTL_HOURS` to a non-negative number.
- `close` recursively removes the complete owned session root.
- `skill-hell sessions` lists valid warm roots by manifest id and generated directory
  name. `skill-hell attach <id|name|root>` emits an export command suitable for `eval`.
- Re-attaching and summoning an already-resident skill returns `warm/session` with zero
  clone and materialization time; the manifest path is accepted only when it remains
  beneath that session's `skills/` root.
- `skill-hell gc --dry-run` lists expired candidates and byte totals; omit
  `--dry-run` to reap them. `--json` returns the same data structurally.
- A manifest PID that still responds to signal 0 is always protected, regardless of
  age. `EPERM` is treated as live; malformed/missing manifests use directory mtime.
- The current summon root is explicitly excluded from its own sweep.

An exit handler was considered but rejected: standalone CLI processes intentionally
exit while their exported `SKILL_HELL_SESSION` remains reusable. An exit hook would
delete a valid shell session immediately, and it would not address `SIGKILL` anyway.
TTL reaping is the crash-safe backstop.

## Payload retention

The retained layer is option **(a), a small on-disk payload store**. It defaults to
`os.tmpdir()/gaia-summon-payload-cache-v1`, outside every session root and outside
`~/.gaia/`. Set `SKILL_HELL_CACHE_DIR` to make the location explicit. The default cap is
16 MiB; set `SKILL_HELL_CACHE_MAX_MB` to a non-negative value (zero disables retention).
Entries are evicted least-recently-used until their total logical size is under the cap.
Only extracted payloads and small metadata files are retained—never repositories.

Each lookup first resolves the current remote commit and keys the entry by SHA-256 of
`repo URL + resolved commit SHA + subpath`. A branch change therefore becomes a miss
rather than silently serving stale content. Missing, evicted, corrupt, manually deleted,
or OS-purged entries always fall back to the normal clone path. The cache does **not**
guarantee offline operation, survival across reboot/temp cleanup, or hash verification.
Hot payloads are normally served from the OS page cache, so this gets memory-like copy
latency without owning a resident process.

Options **(b)** and **(c)** were investigated but rejected. A macOS RAM disk genuinely
stores bytes in memory, but requires `hdiutil`/format/mount lifecycle management, is
platform-specific, disappears on reboot, and adds no meaningful benefit when measured
payload copies already take milliseconds. A daemon can retain bytes and serve them over
a Unix socket, but adds process discovery, locking, upgrade, crash, and shutdown failure
modes merely to avoid a bounded filesystem copy. Both lose to the OS page cache and the
cache-miss correctness of (a).

### Warm across sessions

Measured by summoning, closing the entire session, then summoning in a fresh process:

| skill | cold skill / invocation | warm skill / invocation | retained payload |
|---|---:|---:|---:|
| `garrytan/review` | 2.893s / 4.360s | 0.834s / 1.822s | 188 KiB |
| `anthropic/skill-creator` | 2.716s / 3.057s | 0.843s / 1.164s | 252 KiB |
| `vercel/find-skills` | 2.002s / 2.319s | 0.765s / 1.149s | 12 KiB |

Warm payload-cache skill time includes the remote `ls-remote` freshness check. A warm
re-attached session root bypasses both remote resolution and materialization for an
already-resident skill. Invocation time also includes live registry loading, which
varies independently of payload retention.

## Timing fields

Each materialized skill records `cloneSeconds`, `materializeSeconds`, `totalSeconds`,
`cacheState`, its back-compatible `cache` alias, and `cacheSource` (`remote`, `payload`,
or `session`) in `session.json` and structured results. `cloneSeconds` now measures
source resolution/cache lookup and, on a miss, cloning. `materializeSeconds` measures
the copy into the session. `totalSeconds` is end-to-end skill installation. The summon
result also reports invocation `totalSeconds`. Values are seconds at millisecond
precision; cold and warm observations must remain separate.

## Constraints

- **Session-locked payloads.** Active materializations stay under one temp root.
- **Bounded cross-session cache.** Only commit-addressed payload copies may outlive it.
- **Never mutates the current repository, user config, `~/.gaia/`, or `~/.claude/`.**
- **Read-only registry.** Summon never writes back to the Tree.
- **Untuned ranking.** Higher-rated candidates are preferred; learned weighting is later.

## Not in scope yet

Hell/Heaven Index scoring, routing eligibility, and content-hash admission gates.
