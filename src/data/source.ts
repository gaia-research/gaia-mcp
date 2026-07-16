import type {
  GaiaRegistryDocuments,
  GaiaRegistrySnapshot,
} from "../domain/types.js";
import { genericRegistrySchema, namedRegistrySchema } from "./schemas.js";

export const DEFAULT_GENERIC_REGISTRY_URL =
  "https://gaiaskilltree.com/graph/gaia.json";
export const DEFAULT_NAMED_REGISTRY_URL =
  "https://gaiaskilltree.com/graph/named/index.json";

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1_000;

export class GaiaDataError extends Error {
  override readonly name = "GaiaDataError";
}

export interface GaiaRegistrySource {
  load(): Promise<GaiaRegistrySnapshot>;
}

export type HttpGaiaRegistrySourceOptions = {
  genericUrl?: string;
  namedUrl?: string;
  fetchFn?: typeof fetch;
  now?: () => Date;
  cacheTtlMs?: number;
};

export class HttpGaiaRegistrySource implements GaiaRegistrySource {
  readonly #genericUrl: string;
  readonly #namedUrl: string;
  readonly #fetchFn: typeof fetch;
  readonly #now: () => Date;
  readonly #cacheTtlMs: number;
  #cache?: { snapshot: GaiaRegistrySnapshot; expiresAt: number };

  constructor(options: HttpGaiaRegistrySourceOptions = {}) {
    this.#genericUrl = options.genericUrl ?? DEFAULT_GENERIC_REGISTRY_URL;
    this.#namedUrl = options.namedUrl ?? DEFAULT_NAMED_REGISTRY_URL;
    this.#fetchFn = options.fetchFn ?? fetch;
    this.#now = options.now ?? (() => new Date());
    this.#cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  }

  async load(): Promise<GaiaRegistrySnapshot> {
    const now = this.#now();
    if (this.#cache && this.#cache.expiresAt > now.getTime()) {
      return this.#cache.snapshot;
    }

    const [genericJson, namedJson] = await Promise.all([
      this.#fetchJson(this.#genericUrl),
      this.#fetchJson(this.#namedUrl),
    ]);
    const generic = genericRegistrySchema.safeParse(genericJson);
    if (!generic.success) {
      throw new GaiaDataError(
        `Generic Gaia projection does not match ${"gaia-public-v1"}: ${generic.error.message}`,
      );
    }
    const named = namedRegistrySchema.safeParse(namedJson);
    if (!named.success) {
      throw new GaiaDataError(
        `Named Gaia projection does not match ${"gaia-public-v1"}: ${named.error.message}`,
      );
    }

    const snapshot: GaiaRegistrySnapshot = {
      generic: generic.data,
      named: named.data,
      source: {
        genericUrl: this.#genericUrl,
        namedUrl: this.#namedUrl,
        fetchedAt: now.toISOString(),
      },
    };
    this.#cache = {
      snapshot,
      expiresAt: now.getTime() + this.#cacheTtlMs,
    };
    return snapshot;
  }

  async #fetchJson(url: string): Promise<unknown> {
    let response: Response;
    try {
      response = await this.#fetchFn(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      throw new GaiaDataError(
        `Could not fetch Gaia projection ${url}: ${errorMessage(error)}`,
      );
    }
    if (!response.ok) {
      throw new GaiaDataError(
        `Could not fetch Gaia projection ${url}: HTTP ${response.status}`,
      );
    }
    try {
      return await response.json();
    } catch (error) {
      throw new GaiaDataError(
        `Gaia projection ${url} is not valid JSON: ${errorMessage(error)}`,
      );
    }
  }
}

export class InMemoryGaiaRegistrySource implements GaiaRegistrySource {
  readonly #documents: GaiaRegistryDocuments;

  constructor(documents: GaiaRegistryDocuments) {
    this.#documents = structuredClone(documents);
  }

  async load(): Promise<GaiaRegistrySnapshot> {
    return {
      ...structuredClone(this.#documents),
      source: {
        genericUrl: "memory://gaia/generic",
        namedUrl: "memory://gaia/named",
        fetchedAt: new Date().toISOString(),
      },
    };
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
