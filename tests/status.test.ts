import { describe, expect, it } from "vitest";

import {
  GaiaService,
  InMemoryGaiaRegistrySource,
  type GaiaRegistryDocuments,
} from "../src/index.js";

const documents: GaiaRegistryDocuments = {
  generic: {
    generatedAt: "2026-07-10T00:00:00Z",
    skills: [
      {
        id: "testing",
        name: "Testing",
        type: "basic",
        description: "Runs tests.",
        prerequisites: [],
        derivatives: [],
        evidence: [],
        status: "active",
      },
    ],
  },
  named: {
    generatedAt: "2026-07-10",
    buckets: { testing: [] },
  },
};

describe("GaiaService status", () => {
  it("reports Registry mode, counts, compatibility, and stale data", async () => {
    const service = new GaiaService(
      new InMemoryGaiaRegistrySource(documents),
      {
        now: () => new Date("2026-07-16T12:00:00Z"),
        serverVersion: "0.0.0",
      },
    );

    const result = await service.status();

    expect(result).toMatchObject({
      serverVersion: "0.0.0",
      mode: "registry",
      contractVersion: "gaia-public-v1",
      freshness: "stale",
      counts: { genericSkills: 1, namedSkills: 0 },
      tools: ["gaia_search", "gaia_inspect", "gaia_status"],
      bondedCapabilities: false,
    });
  });
});
