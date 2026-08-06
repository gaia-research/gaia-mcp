import { createHash } from "node:crypto";

const RAW_HOST = "raw.githubusercontent.com";
const FETCH_TIMEOUT_MS = 15_000;

export type FetchedSkillFile = {
  content: string;
  bytes: number;
  sha256: string;
};

/**
 * Rewrite a github.com blob URL to its raw.githubusercontent.com equivalent.
 * URLs already on raw.githubusercontent.com pass through unchanged. Anything
 * that is not a fetchable SKILL.md source returns null.
 */
export function toRawUrl(githubUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(githubUrl);
  } catch {
    return null;
  }

  if (url.hostname === RAW_HOST) {
    return isSkillMdPath(url.pathname) ? url.toString() : null;
  }

  if (url.hostname !== "github.com" || !url.pathname.includes("/blob/")) {
    return null;
  }

  if (!isSkillMdPath(url.pathname)) return null;

  const rewritten = new URL(url.toString());
  rewritten.hostname = RAW_HOST;
  rewritten.pathname = rewritten.pathname.replace("/blob/", "/");
  return rewritten.toString();
}

function isSkillMdPath(pathname: string): boolean {
  return /\/SKILL\.md$/i.test(pathname);
}

export async function fetchSkillFile(
  url: string,
  fetchFn: typeof fetch = fetch,
): Promise<FetchedSkillFile> {
  let response: Response;
  try {
    response = await fetchFn(url, {
      headers: { accept: "text/plain, text/markdown, */*" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error(
      `Could not fetch skill file ${url}: ${errorMessage(error)}`,
    );
  }
  if (!response.ok) {
    throw new Error(
      `Could not fetch skill file ${url}: HTTP ${response.status}`,
    );
  }
  const content = await response.text();
  const bytes = Buffer.byteLength(content, "utf8");
  const sha256 = createHash("sha256").update(content, "utf8").digest("hex");
  return { content, bytes, sha256 };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
