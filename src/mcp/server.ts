import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { GaiaService } from "../service.js";
import { VERSION } from "../version.js";

export type CreateGaiaMcpServerOptions = {
  service: GaiaService;
  version?: string;
};

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

export function createGaiaMcpServer({
  service,
  version = VERSION,
}: CreateGaiaMcpServerOptions): McpServer {
  const server = new McpServer(
    { name: "gaia-mcp", version },
    {
      instructions:
        "Use gaia_search to discover capabilities, gaia_inspect to verify a candidate with evidence, and gaia_status to check data freshness. This v0.1 server is read-only Registry mode; it cannot install, fuse, or mutate skills.",
    },
  );

  server.registerTool(
    "gaia_search",
    {
      title: "Search Gaia skills",
      description:
        "Find generic and Named Skills in the public Gaia Registry. Returns ranked structured results with trust and source freshness metadata.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe("Task, capability, or skill to find."),
        limit: z.number().int().min(1).max(20).optional(),
        kinds: z
          .array(z.enum(["generic", "named"]))
          .min(1)
          .optional(),
        types: z
          .array(z.string().min(1))
          .min(1)
          .optional()
          .describe(
            "Skill types to include. Alias of tiers for client compatibility.",
          ),
        tiers: z.array(z.string().min(1)).min(1).optional(),
        minStars: z.number().int().min(0).max(6).optional(),
        minTrustMagnitude: z.number().min(0).optional(),
        contributors: z.array(z.string().min(1)).min(1).optional(),
        installable: z
          .boolean()
          .optional()
          .describe(
            "Filter by a directly linked, non-blocked SKILL.md source.",
          ),
      }),
      annotations: readOnlyAnnotations,
    },
    async (input): Promise<CallToolResult> => {
      try {
        return toolResult(await service.search(input));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "gaia_inspect",
    {
      title: "Inspect a Gaia skill",
      description:
        "Return an evidence-backed dossier for one generic or Named Skill, including relationships, implementations, trust, sources, and data freshness.",
      inputSchema: z.object({
        id: z
          .string()
          .min(1)
          .describe("Generic id, Named Skill id, or Named catalog reference."),
      }),
      annotations: readOnlyAnnotations,
    },
    async ({ id }): Promise<CallToolResult> => {
      try {
        return toolResult(await service.inspect(id));
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "gaia_status",
    {
      title: "Check Gaia MCP status",
      description:
        "Report server version, Registry mode, data-contract compatibility, source freshness, counts, and available tools.",
      inputSchema: z.object({}),
      annotations: readOnlyAnnotations,
    },
    async (): Promise<CallToolResult> => {
      try {
        return toolResult(await service.status());
      } catch (error) {
        return toolError(error);
      }
    },
  );

  return server;
}

function toolResult(value: object): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: { ...value },
  };
}

function toolError(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error);
  const structuredContent = {
    error: {
      name: error instanceof Error ? error.name : "Error",
      message,
      retryable: error instanceof Error && error.name === "GaiaDataError",
    },
  };
  return {
    content: [{ type: "text", text: message }],
    structuredContent,
    isError: true,
  };
}
