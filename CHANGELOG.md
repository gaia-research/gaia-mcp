# Changelog

## [0.3.0](https://github.com/gaia-research/gaia-mcp/compare/mcp-v0.2.0...mcp-v0.3.0) (2026-08-07)


### Features

* **summon:** ambient summoning and tree-provided trust ([#10](https://github.com/gaia-research/gaia-mcp/issues/10)) ([46b7104](https://github.com/gaia-research/gaia-mcp/commit/46b7104ea1d2b9ef55fa00d582e49a269a9836b5))

## [0.2.0](https://github.com/gaia-research/gaia-mcp/compare/mcp-v0.1.0...mcp-v0.2.0) (2026-08-07)


### Features

* **cli:** gaia-hell binary ([8c0fc71](https://github.com/gaia-research/gaia-mcp/commit/8c0fc712f6ec862554855aa7cd02b9fb64252c4a))
* **cli:** surface timing in human and json output ([e495cb0](https://github.com/gaia-research/gaia-mcp/commit/e495cb0d40c40efea70340d2cdf256cca6f6d488))
* **mcp:** gaia_summon describes install-parity behavior ([d3380c6](https://github.com/gaia-research/gaia-mcp/commit/d3380c6db0c28f25f0f212a6d457ac0d55b53a9c))
* **mcp:** gaia_summon reports timing ([e5660d5](https://github.com/gaia-research/gaia-mcp/commit/e5660d5cc4d66c396ada0da7982dadaa68569534))
* **mcp:** gaia_summon tool + status honesty ([3f4670a](https://github.com/gaia-research/gaia-mcp/commit/3f4670a207e83e7e37347ccbb33293e8f970dfa0))
* **summon:** fetch + raw URL rewriting ([dd08d9d](https://github.com/gaia-research/gaia-mcp/commit/dd08d9d999ad7ca7236e0eb890c878cd96633e9c))
* **summon:** install timing — clone, materialize, total, cold vs warm ([abd9228](https://github.com/gaia-research/gaia-mcp/commit/abd9228cf9e672b2da8e4a6c7a3eb06d6a40e2e9))
* **summon:** materialize whole skill directory + validation ([a6c3c36](https://github.com/gaia-research/gaia-mcp/commit/a6c3c367f9343844001d4af812327d952c15bd7e))
* **summon:** materialize whole skill directory via recursive copy ([68bc28a](https://github.com/gaia-research/gaia-mcp/commit/68bc28a5d6df8ead16a046e691bc4f65f7ad30b0))
* **summon:** port _parse_github_url to install parity ([9154cb0](https://github.com/gaia-research/gaia-mcp/commit/9154cb05dfdb0403a51c57307a8ba53e90a2bf77))
* **summon:** reap abandoned session roots ([80d40c1](https://github.com/gaia-research/gaia-mcp/commit/80d40c13f0c0d07f86f8520ced16bbbbde31d0bd))
* **summon:** retain bounded commit-addressed payloads ([daee625](https://github.com/gaia-research/gaia-mcp/commit/daee62544dc04de918e7e4e2d1be0111345f8cc3))
* **summon:** session-locked materialization ([938cd08](https://github.com/gaia-research/gaia-mcp/commit/938cd088c60812d0fc43c270a991e82c68141b24))
* **summon:** shallow clone with session-scoped cache ([be247bd](https://github.com/gaia-research/gaia-mcp/commit/be247bdcf7857f3a683e401df59d5baf7d32efc5))
* **summon:** suiteComponents recursive summon ([7b59bf8](https://github.com/gaia-research/gaia-mcp/commit/7b59bf840f295a1a0189bc2313b38a060cdb6c1b))
* **summon:** summon orchestrator ([e20d423](https://github.com/gaia-research/gaia-mcp/commit/e20d423c2e41dc2f4318173e31098b2c223c257e))
* **summon:** untuned ranking preferring higher-rated skills ([ad1dceb](https://github.com/gaia-research/gaia-mcp/commit/ad1dceb44f70d3c7477cf3dfa177476abbe4d2f6))


### Bug Fixes

* **cache:** size the payload by file bytes, not directory inodes ([6c66ed1](https://github.com/gaia-research/gaia-mcp/commit/6c66ed1fdd4d9802edb254cd83e583ba49676aac))
* **summon:** discard transient clones after extraction ([e9efc99](https://github.com/gaia-research/gaia-mcp/commit/e9efc999136a3aaf6bc683e747eb799a87d107b6))
* **summon:** isolate payload cache from session reaping ([d4bb910](https://github.com/gaia-research/gaia-mcp/commit/d4bb910ea7ada66c3ec986fc620788fcdc507ffb))
* **summon:** measure invocation timing from entry ([06a89bd](https://github.com/gaia-research/gaia-mcp/commit/06a89bd2ec916af3d53c02e921f5ffc84cc22856))
* **summon:** relevance gates, rating orders ([b46e319](https://github.com/gaia-research/gaia-mcp/commit/b46e3192f237b43de433e6f3b6343bb60ed4e150))

## 0.1.0 (2026-07-16)

### Features

* ship Gaia MCP v0.1 Trusted Discovery ([#3](https://github.com/gaia-research/gaia-mcp/issues/3)) ([09e2b5e](https://github.com/gaia-research/gaia-mcp/commit/09e2b5e27a47935c85236c7518d48f2d67e5a8f3))

### Bug Fixes

* synchronize release runtime version ([#5](https://github.com/gaia-research/gaia-mcp/issues/5)) ([964cbce](https://github.com/gaia-research/gaia-mcp/commit/964cbce5dcb16fe9d8a6d04a993d115f5af37d50))
