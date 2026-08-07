import { createServer, type Server } from "node:http";
import { resolve } from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("gaia-mcp stdio executable", () => {
  let fixtureServer: Server;
  let baseUrl: string;
  let client: Client | undefined;

  beforeEach(async () => {
    fixtureServer = createServer((request, response) => {
      response.setHeader("content-type", "application/json");
      if (request.url === "/named.json") {
        response.end(
          JSON.stringify({
            generatedAt: "2026-07-16",
            buckets: {
              "automated-testing": [
                {
                  id: "example/health",
                  name: "Health",
                  contributor: "example",
                  genericSkillRef: "automated-testing",
                  status: "named",
                  level: "2★",
                  description: "Runs tests.",
                  catalogRef: "example-health",
                  tags: [],
                  links: {},
                  evidence: [],
                },
              ],
            },
          }),
        );
        return;
      }
      response.end(
        JSON.stringify({
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
        }),
      );
    });
    await new Promise<void>((resolveListen) => {
      fixtureServer.listen(0, "127.0.0.1", resolveListen);
    });
    const address = fixtureServer.address();
    if (!address || typeof address === "string") {
      throw new Error("Fixture server did not open a TCP port.");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await client?.close();
    await new Promise<void>((resolveClose, reject) => {
      fixtureServer.close((error) => (error ? reject(error) : resolveClose()));
    });
  });

  it("initializes, lists tools, and executes a query as a child process", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [resolve("dist/bin/gaia-mcp.js")],
      env: {
        PATH: process.env.PATH ?? "",
        HOME: process.env.HOME ?? "",
        GAIA_REGISTRY_URL: `${baseUrl}/generic.json`,
        GAIA_NAMED_SKILLS_URL: `${baseUrl}/named.json`,
      },
      stderr: "pipe",
    });
    client = new Client({ name: "stdio-test", version: "1.0.0" });
    await client.connect(transport);

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual([
      "gaia_search",
      "gaia_inspect",
      "summon",
      "gaia_status",
    ]);
    const result = await client.callTool({
      name: "gaia_search",
      arguments: { query: "automated testing" },
    });
    expect(result.structuredContent).toMatchObject({
      results: expect.arrayContaining([
        expect.objectContaining({ id: "automated-testing" }),
      ]),
      meta: {
        sources: {
          generic: `${baseUrl}/generic.json`,
          named: `${baseUrl}/named.json`,
        },
      },
    });
  });
});
