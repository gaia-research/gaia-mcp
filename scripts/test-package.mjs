import { execFile } from "node:child_process";
import { mkdtemp, rm, unlink } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const temporaryDirectory = await mkdtemp(join(tmpdir(), "gaia-mcp-package-"));
const realNpmEnvironment = { ...process.env, npm_config_dry_run: "false" };
let tarballPath;
let fixtureServer;
let client;

try {
  const { stdout } = await execFileAsync(
    "npm",
    ["pack", "--ignore-scripts", "--json"],
    {
      cwd: root,
      env: realNpmEnvironment,
    },
  );
  const packResult = JSON.parse(stdout);
  tarballPath = join(root, packResult[0].filename);

  await execFileAsync("npm", ["init", "--yes"], {
    cwd: temporaryDirectory,
    env: realNpmEnvironment,
  });
  await execFileAsync(
    "npm",
    ["install", tarballPath, "--ignore-scripts", "--no-audit", "--no-fund"],
    { cwd: temporaryDirectory, env: realNpmEnvironment },
  );

  fixtureServer = createServer((request, response) => {
    response.setHeader("content-type", "application/json");
    response.end(
      JSON.stringify(
        request.url === "/named.json"
          ? {
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
            }
          : {
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
      ),
    );
  });
  await new Promise((resolveListen) =>
    fixtureServer.listen(0, "127.0.0.1", resolveListen),
  );
  const address = fixtureServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Package fixture server did not open a TCP port.");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const executable = join(
    temporaryDirectory,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "gaia-mcp.cmd" : "gaia-mcp",
  );
  const transport = new StdioClientTransport({
    command: executable,
    env: {
      PATH: process.env.PATH ?? "",
      HOME: process.env.HOME ?? "",
      GAIA_REGISTRY_URL: `${baseUrl}/generic.json`,
      GAIA_NAMED_SKILLS_URL: `${baseUrl}/named.json`,
    },
    stderr: "pipe",
  });
  client = new Client({ name: "package-test", version: "1.0.0" });
  await client.connect(transport);

  const tools = await client.listTools();
  if (tools.tools.length !== 3) {
    throw new Error(`Expected 3 tools, received ${tools.tools.length}.`);
  }
  const result = await client.callTool({
    name: "gaia_search",
    arguments: { query: "automated testing" },
  });
  const firstResult = result.structuredContent?.results?.[0];
  if (
    typeof firstResult !== "object" ||
    firstResult === null ||
    firstResult.id !== "automated-testing"
  ) {
    throw new Error("Packed server did not return the expected search result.");
  }

  process.stdout.write("Clean package install and stdio query passed.\n");
} finally {
  await client?.close();
  if (fixtureServer) {
    await new Promise((resolveClose, reject) =>
      fixtureServer.close((error) => (error ? reject(error) : resolveClose())),
    );
  }
  if (tarballPath) await unlink(tarballPath).catch(() => undefined);
  await rm(temporaryDirectory, { recursive: true, force: true });
}
