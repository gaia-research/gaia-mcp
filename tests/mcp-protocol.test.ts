import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";

import {
  createGaiaMcpServer,
  GaiaService,
  InMemoryGaiaRegistrySource,
  type GaiaRegistryDocuments,
} from "../src/index.js";

const documents: GaiaRegistryDocuments = {
  generic: {
    generatedAt: "2026-07-16T00:00:00Z",
    skills: [
      {
        id: "automated-testing",
        name: "Automated Testing",
        type: "basic",
        description: "Runs test suites and explains failures.",
        prerequisites: [],
        derivatives: [],
        evidence: [],
        status: "active",
      },
    ],
  },
  named: { generatedAt: "2026-07-16", buckets: {} },
};

describe("Gaia MCP protocol", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  });

  it("lists the v0.1 tools and returns structured search results", async () => {
    const service = new GaiaService(new InMemoryGaiaRegistrySource(documents), {
      now: () => new Date("2026-07-16T12:00:00Z"),
    });
    const server = createGaiaMcpServer({ service, version: "0.0.0" });
    const client = new Client({ name: "gaia-mcp-test", version: "1.0.0" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    closeCallbacks.push(
      () => client.close(),
      () => server.close(),
    );

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual([
      "gaia_search",
      "gaia_inspect",
      "gaia_status",
    ]);

    const result = await client.callTool({
      name: "gaia_search",
      arguments: { query: "automated testing" },
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      query: "automated testing",
      results: [{ kind: "generic", id: "automated-testing" }],
      meta: { contractVersion: "gaia-public-v1", freshness: "fresh" },
    });
  });

  it("returns a structured tool error when a skill is not found", async () => {
    const service = new GaiaService(new InMemoryGaiaRegistrySource(documents));
    const server = createGaiaMcpServer({ service, version: "0.0.0" });
    const client = new Client({ name: "gaia-mcp-test", version: "1.0.0" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    closeCallbacks.push(
      () => client.close(),
      () => server.close(),
    );

    const result = await client.callTool({
      name: "gaia_inspect",
      arguments: { id: "missing-skill" },
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toEqual({
      error: {
        name: "Error",
        message: "Gaia skill not found: missing-skill",
        retryable: false,
      },
    });
  });
});
