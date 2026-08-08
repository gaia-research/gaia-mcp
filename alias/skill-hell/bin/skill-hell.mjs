#!/usr/bin/env node
// Forwards to @gaia-research/mcp's skill-hell binary. `npm exec`/`npx` picks a
// binary to run by reading *this* package's own manifest (not a hoisted
// dependency's bin) — without this file, `npx skill-hell` in a directory
// where skill-hell isn't already installed fails with
// "could not determine executable to run".
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const entryUrl = import.meta.resolve("@gaia-research/mcp");
const entryPath = fileURLToPath(entryUrl);
const binPath = path.join(path.dirname(entryPath), "bin", "skill-hell.js");
await import(pathToFileURL(binPath).href);
