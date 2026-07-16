# Delivery Roadmap

The roadmap is outcome-based. Dates are intentionally omitted until the
cross-repository contracts are accepted.

## M0 — Architecture baseline

Status: complete.

- establish standalone ownership;
- define repository seams and non-goals;
- identify required Gaia public-data and CLI contracts;
- file extraction and website-integration handoffs.

No runnable MCP server is claimed in M0.

## v0.1 — Trusted discovery

Status: implementation under review; publication pending.

Goal: an agent can discover and evaluate Gaia skills using current canonical
data.

- `gaia_search`;
- `gaia_inspect`;
- `gaia_status` in Registry mode;
- structured results with sources and freshness;
- stdio transport;
- clean installation and protocol tests;
- first public npm package and GitHub Release.

Kill criterion: a clean MCP client can install the package, search for a task,
inspect the recommended skill, and trace every trust claim to canonical Gaia
data.

## v0.2 — Bonded workspace context

Goal: combine Registry truth with canonical local Gaia context.

- Gaia CLI compatibility negotiation;
- `gaia_status` in Bonded mode;
- `gaia_analyze_project`;
- `gaia_plan_path`;
- fail-closed behavior when a local machine contract is unavailable.

Kill criterion: an agent can explain what the current workspace demonstrates
and what is missing without reading Gaia repository internals.

## v0.3 — Guarded actions

Goal: move from recommendation to safe local action.

- installation preview/apply;
- update preview/apply;
- Intake preparation;
- Intake submission through the canonical Gaia CLI;
- explicit approval, audit, and recovery tests.

Kill criterion: a user can move from capability need to trusted installed skill
in one agent conversation, with a visible preview and explicit approval.

## v0.4 — Canonical consumers

Goal: remove duplicate Gaia MCP behavior across the organization.

- migrate `community-bot`;
- publish client compatibility matrix;
- add the Gaia Research product page and website acceptance test;
- retire the old Skill Tree MCP implementation after parity.

## v1.0 — Stable Bond contract

Goal: commit to a stable public tool and compatibility interface.

- stable tool names and structured result schemas;
- documented deprecation window;
- supported Gaia public-data and CLI compatibility ranges;
- security review of every action path;
- operational release and rollback runbook.

Hosted Streamable HTTP MCP is not a v1 requirement. It enters the roadmap only
with a concrete authentication and operating use case.
