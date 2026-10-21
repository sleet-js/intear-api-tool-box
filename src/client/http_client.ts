// =========================
// `http_client` — typed `fetch` wrapper for the one-shot endpoints (plus the
// HTTP-only ones: `public_key`, `stats`, `cosmetics`, icon fetches).
//
// Conventions:
//   * base URL defaults to `https://api.intea.rs`, override via the
//     constructor for test/staging.
//   * `get(path, params)` URL-encodes a params object using the documented
//     rules (list = comma-separated; nested objects use dotted keys;
//     `where.*` keys are unprefixed; sort `-field` = descending).
//   * `post(path, body)` sends a JSON body for params too long for a URL.
//   * Errors throw `api_error` with the upstream `code` and `message`.
// =========================

import type { server_error } from "../types/common";
import { null_logger } from "../helpers/logger";
import type { logger } from "../helpers/logger";

export const DEFAULT_BASE_URL = "https://api.intea.rs";

export interface api_error_init {
  status: number;
  body: unknown;
  error: server_error;
}

export class api_error extends Error {
  readonly status: number;
  readonly code: string;

  constructor(init: api_error_init) {
    super(`${init.error.code}: ${init.error.message}`);
    this.name = "api_error";
    this.status = init.status;
    this.code = init.error.code;
  }
}

const is_record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// Build a query string from a params object using Intear's encoding rules:
//   * arrays -> CSV,
//   * objects -> dotted keys,
//   * `where.*` is unprefixed at the top level (i.e. min_reputation, min.x),
//   * booleans render as `true` / `false`, NOT as the strings "true"/"false",
//     because the server rejects string booleans in some endpoints (see
//     `tokens.sort.desc` — server expects a JSON boolean, not a string).
export const build_query = (params: Record<string, unknown>): string => {
  const parts: string[] = [];
  const append = (key: string, value: unknown): void => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      const csv = value
        .filter((v) => v !== undefined && v !== null)
        .map((v) => encode_scalar(v))
        .join(",");
      if (csv.length > 0) parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(csv)}`);
      return;
    }
    if (is_record(value)) {
      for (const [k, v] of Object.entries(value)) {
        append(`${key}.${k}`, v);
      }
      return;
    }
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(encode_scalar(value))}`);
  };

  for (const [k, v] of Object.entries(params)) {
    if (k === "where" && is_record(v)) {
      // Per docs: where.* keys are at the top level of the query string.
      for (const [wk, wv] of Object.entries(v)) append(wk, wv);
      continue;
    }
    // `sort: { by, desc: true }` is accepted by the server as a JSON object
    // (per the schema), but the URL-encoded form has a long-standing
    // boolean-parsing quirk: `sort.desc=true` comes through as the string
    // "true" rather than a JSON boolean. The server's documented workaround
    // is the `-field` form. We rewrite the object to that form so the
    // caller can stay typed.
    if (k === "sort" && is_record(v) && typeof v["by"] === "string") {
      append("sort", v["desc"] === true ? `-${v["by"]}` : v["by"]);
      continue;
    }
    append(k, v);
  }
  return parts.join("&");
};

// Render a scalar for a URL value. Numbers and booleans use their literal
// JS forms; everything else is stringified (the upstream API stringifies
// amounts, dates-millis and account IDs).
const encode_scalar = (v: unknown): string => {
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  return String(v);
};

export interface http_client_options {
  base_url?: string;
  fetch?: typeof fetch;
  logger?: logger;
}

export class http_client {
  readonly #base_url: string;
  readonly #fetch: typeof fetch;
  readonly #logger: logger;

  constructor(opts: http_client_options = {}) {
    this.#base_url = (opts.base_url ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.#fetch = opts.fetch ?? globalThis.fetch;
    this.#logger = opts.logger ?? new null_logger();
  }

  get base_url(): string {
    return this.#base_url;
  }

  // GET with URL-encoded params. Throws on non-ok status with a typed api_error.
  async get<t>(path: string, params?: Record<string, unknown>): Promise<t> {
    const qs = params ? build_query(params) : "";
    const url = qs.length > 0 ? `${this.#base_url}${path}?${qs}` : `${this.#base_url}${path}`;
    const start = Date.now();
    this.#logger.info("http request", { method: "GET", path, url });
    const response = await this.#fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    return parse_response<t>(response, this.#logger, start, "GET", path);
  }

  // POST with a JSON body, for params too long for a URL.
  async post<t>(path: string, body: unknown): Promise<t> {
    const start = Date.now();
    this.#logger.info("http request", { method: "POST", path, base_url: this.#base_url });
    const response = await this.#fetch(`${this.#base_url}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    return parse_response<t>(response, this.#logger, start, "POST", path);
  }

  // Construct an icon URL; the icon image itself is fetched by the consumer.
  icon_url(icon_hash: string): string {
    return `${this.#base_url}/icon/${icon_hash}.webp`;
  }
}

const parse_response = async <t>(
  response: Response,
  logger: logger,
  start_ms: number,
  method: string,
  path: string,
): Promise<t> => {
  const duration_ms = Date.now() - start_ms;
  let parsed: unknown;
  const text = await response.text();
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    logger.warn("http parse failure", {
      method,
      path,
      status: response.status,
      duration_ms,
      body_preview: text.slice(0, 200),
    });
    throw new api_error({
      status: response.status,
      body: text,
      error: {
        code: "internal",
        message: `Invalid JSON in response (${response.status}): ${text.slice(0, 200)}`,
      },
    });
  }
  // Emit a one-line summary at the end of every request, including errors,
  // so a consumer with level=info sees "request sent" AND "request
  // completed" with the outcome.
  if (!response.ok) {
    const parsed_error = is_record(parsed) ? parsed["error"] : undefined;
    const err: server_error =
      is_record(parsed_error) && typeof parsed_error["code"] === "string"
        ? { code: parsed_error["code"], message: String(parsed_error["message"] ?? "") }
        : {
            code: response.status === 404 ? "not_found" : "internal",
            message: response.statusText || `HTTP ${response.status}`,
          };
    logger.warn("http error", {
      method,
      path,
      status: response.status,
      duration_ms,
      code: err.code,
      message: err.message,
    });
    throw new api_error({ status: response.status, body: parsed, error: err });
  }
  logger.info("http response", {
    method,
    path,
    status: response.status,
    duration_ms,
    credits_used: extract_credits(parsed),
  });
  return parsed as t;
};

// Best-effort: the API sends `credits_used` at the top level of every
// response (and `not_indexed` 503s return it too). Don't crash if it's
// not there.
const extract_credits = (body: unknown): number | null => {
  if (is_record(body) && typeof body["credits_used"] === "number") {
    return body["credits_used"];
  }
  return null;
};
