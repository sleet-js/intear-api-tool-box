// =========================
// `balances.subscribe` — WS subscription. Each push carries the balances
// that changed in that block. Re-checking by `tokens.subscribe`-style
// `set` for `token_fields` changes when those are passed.
// =========================

import type { WsClient, WsSubscriptionHandle } from "../../client/ws_client";
import type {
  BalancesSubscribeParams,
  BalancesSubscribeResponse,
  BalancePush,
} from "../../types/balance";
import type { TokenRequestedField } from "../../types/token";
import { SubscriptionImpl, type Subscription } from "../../helpers/subscribe";

export const subscribe_balances = <F extends readonly TokenRequestedField[]>(
  ws: WsClient,
  params: BalancesSubscribeParams,
): Subscription<BalancePush, BalancesSubscribeResponse<F>> => {
  const sub = new SubscriptionImpl<BalancePush, BalancesSubscribeResponse<F>>({
    unsubscribe_fn: async () => {
      const id = handle.get_id?.();
      if (id == null) return;
      await ws.unsubscribe(id);
    },
  });

  const handle: WsSubscriptionHandle = {
    id: -1,
    method: "balances.subscribe",
    params,
    get_id: () => null,
    set_result: (r) => sub.set_result(r as BalancesSubscribeResponse<F>),
    push: (p) => sub.push(p as BalancePush),
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