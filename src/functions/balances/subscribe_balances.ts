// =========================
// `balances.subscribe` — WS subscription. Each push carries the balances
// that changed in that block. Re-checking by `tokens.subscribe`-style
// `set` for `token_fields` changes when those are passed.
// =========================

import type { ws_client, ws_subscription_handle } from "../../client/ws_client";
import type {
  balances_subscribe_params,
  balances_subscribe_response,
  balance_push,
} from "../../types/balance";
import type { token_requested_field } from "../../types/token";
import { subscription_impl, type subscription } from "../../helpers/subscribe";

export const subscribe_balances = <f extends readonly token_requested_field[]>(
  ws: ws_client,
  params: balances_subscribe_params,
): subscription<balance_push, balances_subscribe_response<f>> => {
  const sub = new subscription_impl<balance_push, balances_subscribe_response<f>>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  });

  const handle: ws_subscription_handle = {
    id: -1,
    method: "balances.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as balances_subscribe_response<f>),
    push: (p) => sub.push(p as balance_push),
    end: (code, message) => sub.end(code, message),
    unsubscribe: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  };

  ws.subscribe("balances.subscribe", params as unknown as Record<string, unknown>, handle);
  return sub;
};
