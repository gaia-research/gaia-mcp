import { readFile, writeFile } from "node:fs/promises";

const [notesPath, compatibilityPath, version] = process.argv.slice(2);
if (!notesPath || !compatibilityPath || !version) {
  throw new Error(
    "Usage: append-release-notes.mjs <notes> <compatibility> <version>",
  );
}

const notes = await readFile(notesPath, "utf8");
const compatibility = await readFile(compatibilityPath, "utf8");
const compatibilityBody = compatibility.replace(/^# Compatibility\s*/u, "");
const marker = `## Compatibility for v${version}`;

if (!notes.includes(marker)) {
  await writeFile(
    notesPath,
    `${notes.trim()}\n\n${marker}\n\n${compatibilityBody.trim()}\n`,
  );
}
