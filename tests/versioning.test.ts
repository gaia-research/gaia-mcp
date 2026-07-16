import { readFile } from "node:fs/promises";

import { SUPPORTED_PROTOCOL_VERSIONS } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it } from "vitest";

import { VERSION } from "../src/index.js";

describe("release versioning", () => {
  it("keeps the package and runtime versions synchronized", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("../package.json", import.meta.url), "utf8"),
    );

    expect(VERSION).toBe(packageJson.version);
  });

  it("configures Release Please to update the runtime version", async () => {
    const config = JSON.parse(
      await readFile(
        new URL("../release-please-config.json", import.meta.url),
        "utf8",
      ),
    );

    expect(
      config.packages["."].extraFiles ?? config.packages["."]["extra-files"],
    ).toContainEqual({ type: "generic", path: "src/version.ts" });
  });

  it("records every protocol version exercised by the SDK matrix", async () => {
    const compatibility = await readFile(
      new URL("../COMPATIBILITY.md", import.meta.url),
      "utf8",
    );

    for (const protocolVersion of SUPPORTED_PROTOCOL_VERSIONS) {
      expect(compatibility).toContain(protocolVersion);
    }
  });
});
