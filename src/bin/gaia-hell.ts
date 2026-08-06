#!/usr/bin/env node

import {
  DEFAULT_GENERIC_REGISTRY_URL,
  DEFAULT_NAMED_REGISTRY_URL,
  HttpGaiaRegistrySource,
} from "../data/source.js";
import { GaiaService } from "../service.js";
import { resolveSession } from "../summon/session.js";
import { summon } from "../summon/summon.js";

const LABEL_WIDTH = 8;

const USAGE = `Usage:
  gaia-hell summon "<intent>" [--limit N] [--json]
  gaia-hell list [--json]
  gaia-hell path [--json]
  gaia-hell close [--json]
`;

class UsageError extends Error {
  override readonly name = "UsageError";
}

type ParsedArgs = {
  command: string;
  query: string | undefined;
  limit: number | undefined;
  json: boolean;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  switch (args.command) {
    case "summon":
      await runSummon(args);
      return;
    case "list":
      await runList(args);
      return;
    case "path":
      await runPath(args);
      return;
    case "close":
      await runClose(args);
      return;
    default:
      throw new UsageError(`Unknown command: ${args.command}\n\n${USAGE}`);
  }
}

async function runSummon(args: ParsedArgs): Promise<void> {
  if (!args.query) {
    throw new UsageError(`summon requires a query.\n\n${USAGE}`);
  }
  const service = createService();
  const { session, created } = await resolveSession();
  noteIfCreated(created, session.root);

  const outcome = await summon(service, session, {
    query: args.query,
    limit: args.limit,
  });

  if (args.json) {
    writeJson(outcome);
  } else {
    for (const result of outcome.summoned) {
      printSkillLine(
        "summoned",
        result.id,
        result.level,
        result.trustMagnitude,
        result.path,
      );
    }
  }

  if (outcome.summoned.length === 0) {
    process.stderr.write(
      `gaia-hell: no skill could be summoned for "${outcome.query}".\n`,
    );
    for (const skip of outcome.skipped) {
      process.stderr.write(`  skipped ${skip.id}: ${skip.reason}\n`);
    }
    process.exitCode = 1;
  }
}

async function runList(args: ParsedArgs): Promise<void> {
  const { session, created } = await resolveSession();
  noteIfCreated(created, session.root);

  if (args.json) {
    writeJson({ sessionRoot: session.root, skills: session.skills });
    return;
  }

  if (session.skills.length === 0) {
    process.stdout.write("  (no skills summoned in this session)\n");
    return;
  }
  for (const skill of session.skills) {
    printSkillLine(
      "resident",
      skill.id,
      skill.level,
      skill.trustMagnitude,
      skill.path,
    );
  }
}

async function runPath(args: ParsedArgs): Promise<void> {
  const { session, created } = await resolveSession();
  noteIfCreated(created, session.root);

  if (args.json) {
    writeJson({ sessionRoot: session.root });
  } else {
    process.stdout.write(`${session.root}\n`);
  }
}

async function runClose(args: ParsedArgs): Promise<void> {
  const existingRoot = process.env.GAIA_HELL_SESSION;
  if (!existingRoot) {
    if (args.json) {
      writeJson({ closed: false, reason: "GAIA_HELL_SESSION is not set" });
    } else {
      process.stdout.write("  (no active session; nothing to close)\n");
    }
    return;
  }

  const { session } = await resolveSession();
  await session.close();

  if (args.json) {
    writeJson({ closed: true, sessionRoot: existingRoot });
  } else {
    process.stdout.write(`  closed    ${existingRoot}\n`);
  }
}

function createService(): GaiaService {
  const source = new HttpGaiaRegistrySource({
    genericUrl: process.env.GAIA_REGISTRY_URL ?? DEFAULT_GENERIC_REGISTRY_URL,
    namedUrl: process.env.GAIA_NAMED_SKILLS_URL ?? DEFAULT_NAMED_REGISTRY_URL,
  });
  return new GaiaService(source);
}

function noteIfCreated(created: boolean, root: string): void {
  if (!created) return;
  process.stderr.write(
    `gaia-hell: no active session; created one.\ngaia-hell: reuse it across commands with: export GAIA_HELL_SESSION=${root}\n`,
  );
}

function printSkillLine(
  label: string,
  id: string,
  level: string,
  trustMagnitude: number | undefined,
  filePath: string,
): void {
  const prefix = `  ${label.padEnd(LABEL_WIDTH)}  `;
  process.stdout.write(
    `${prefix}${id}  ${level}  TM ${formatTrustMagnitude(trustMagnitude)}\n`,
  );
  process.stdout.write(`${" ".repeat(prefix.length)}-> ${filePath}\n`);
}

function formatTrustMagnitude(value: number | undefined): string {
  return value === undefined ? "n/a" : value.toFixed(1);
}

function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function parseArgs(argv: string[]): ParsedArgs {
  const command = argv[0];
  if (!command) {
    throw new UsageError(USAGE);
  }
  const rest = argv.slice(1);
  let limit: number | undefined;
  let json = false;
  const positionals: string[] = [];

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === undefined) continue;
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--limit") {
      const value = rest[i + 1];
      if (value === undefined) {
        throw new UsageError("--limit requires a value.");
      }
      limit = parseLimit(value);
      i++;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      limit = parseLimit(arg.slice("--limit=".length));
      continue;
    }
    if (arg.startsWith("-")) {
      throw new UsageError(`Unknown flag: ${arg}\n\n${USAGE}`);
    }
    positionals.push(arg);
  }

  return { command, query: positionals[0], limit, json };
}

function parseLimit(value: string): number {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 5) {
    throw new UsageError(
      `--limit must be an integer between 1 and 5, got: ${value}`,
    );
  }
  return limit;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`gaia-hell: ${message}\n`);
  process.exitCode = 1;
});
