// =========================
// Exponential-backoff helper used by the WebSocket client to reconnect.
// Returns a `Promise<void>` that resolves when the next reconnect attempt is
// due. Pure function; takes the attempt number, returns the delay in ms.
// A attempt attempt of 0 always resolves immediately.
// =========================

export const reconnect_delay = (attempt: number, base_ms = 500, max_ms = 15_000): number => {
  if (attempt <= 0) return 0;
  // Full-jitter exponential backoff, capped at `max_ms`.
  const exp = Math.min(base_ms * 2 ** (attempt - 1), max_ms);
  return Math.floor(Math.random() * exp);
};

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
