import { describe, expect, it } from "vitest";

import { GaiaService, HttpGaiaRegistrySource } from "../src/index.js";

describe("live Gaia public-data contract", () => {
  it("searches and inspects the current public Registry projection", async () => {
    const service = new GaiaService(new HttpGaiaRegistrySource());

    const status = await service.status();
    expect(status.counts.genericSkills).toBeGreaterThan(200);
    expect(status.counts.namedSkills).toBeGreaterThan(100);
    expect(status.sources.generic).toBe(
      "https://gaiaskilltree.com/graph/gaia.json",
    );

    const search = await service.search({
      query: "automated testing",
      limit: 5,
    });
    expect(search.results).toContainEqual(
      expect.objectContaining({
        kind: "generic",
        id: "automated-testing",
      }),
    );

    const inspect = await service.inspect("automated-testing");
    expect(inspect.skill).toMatchObject({
      kind: "generic",
      id: "automated-testing",
    });
    expect(inspect.meta.genericGeneratedAt).toMatch(/^20\d\d-/);
  });
});
