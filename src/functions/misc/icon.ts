// =========================
// `icon_url(icon_hash)` — returns the public URL for a token's icon. The image
// itself is a `Cache-Control: public, max-age=31536000, immutable` WebP of
// up to 128×128, so the consumer can `fetch()` it directly. The icon is also
// available via `http_client.icon_url()` for parity.
// =========================

import type { http_client } from "../../client/http_client";

export const icon_url = (http: http_client, icon_hash: string): string =>
  http.icon_url(icon_hash);
