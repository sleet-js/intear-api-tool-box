// =========================
// Diagnostic logging.
//
// Two pieces:
//   1. `log_level` — a verbosity threshold. Default `none` (silent).
//      `info` adds one line per HTTP/WS round trip; `warn` also surfaces
//      reconnect attempts; `debug` adds per-push traces and envelope dumps.
//   2. `logger` — a pluggable sink. Defaults to `console_Logger`, which
//      routes to `console.{info, warn, error}`. Consumers can swap it for
//      pino, winston, datadog, etc., by passing a `logger` to
//      `intear_api_options`.
//
// Every call includes an `endpoint` field (HTTP path or WS method name)
// and a `sub` field where relevant, so the consumer can grep logs for
// "tokens.get" or "sub 7" to find which call owns a given diagnostic.
// =========================

export const LOG_LEVELS = ["none", "info", "warn", "debug"] as const;
export type log_level = (typeof LOG_LEVELS)[number];

const level_rank: Record<log_level, number> = {
  none: 0,
  info: 1,
  warn: 2,
  debug: 3,
};

export interface logger {
  info(event: string, fields: Record<string, unknown>): void;
  warn(event: string, fields: Record<string, unknown>): void;
  debug(event: string, fields: Record<string, unknown>): void;
  error(event: string, fields: Record<string, unknown>): void;
}

// =========================
// Default sink: writes nothing when `level` is `none`; otherwise routes
// to console.{info, warn, error} with a one-line "event ..." prefix so a
// quick grep of stdout finds it.
// =========================
export class console_logger implements logger {
  readonly #level: log_level;
  constructor(level: log_level) {
    this.#level = level;
  }

  #emit(needed: log_level, channel: string, event: string, fields: Record<string, unknown>): void {
    if (level_rank[this.#level] < level_rank[needed]) return;
    const flat = Object.entries(fields)
      .map(([k, v]) => `${k}=${format(v)}`)
      .join(" ");
    const line = `[intear_api:${channel}] ${event} ${flat}`.trim();
    if (channel === "error") console.error(line);
    else if (channel === "warn") console.warn(line);
    else console.log(line);
  }

  info(event: string, fields: Record<string, unknown>): void {
    this.#emit("info", "info", event, fields);
  }
  warn(event: string, fields: Record<string, unknown>): void {
    this.#emit("warn", "warn", event, fields);
  }
  debug(event: string, fields: Record<string, unknown>): void {
    this.#emit("debug", "debug", event, fields);
  }
  error(event: string, fields: Record<string, unknown>): void {
    // Treat errors as info-level events for filtering purposes. With
    // `level: "none"` (silent mode), even errors are dropped — that's
    // what "silent" means. To always see errors, supply a custom logger
    // that ignores the level filter and routes `error()` straight to
    // console.error / Sentry / etc.
    this.#emit("info", "error", event, fields);
  }
}

// =========================
// Null logger — never emits. Used when level is `none` AND the user
// didn't supply a logger of their own. Cheap, allows hot-path guarding
// out of the way.
// =========================
export class null_logger implements logger {
  info(): void { /* no-op */ }
  warn(): void { /* no-op */ }
  debug(): void { /* no-op */ }
  error(): void { /* no-op */ }
}

// Format a value for a one-line log entry. Objects flatten to JSON-ish
// strings; BigInt and unknown values don't crash the formatter.
const format = (v: unknown): string => {
  if (v === null || v === undefined) return String(v);
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return JSON.stringify(v);
  }
  if (typeof v === "bigint") return `${v.toString()}n`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};
