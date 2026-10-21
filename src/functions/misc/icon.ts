// =========================
// `icon_url(icon_hash)` — returns the public URL for a token's icon. The image
// itself is a `Cache-Control: public, max-age=31536000, immutable` WebP of
// up to 128×128, so the consumer can `fetch()` it directly. The icon is also
// available via `HttpClient.icon_url()` for parity.
// =========================

import type { HttpClient } from "../../client/http_client";

export const icon_url = (http: HttpClient, icon_hash: string): string =>
  http.icon_url(icon_hash);
