type BaseOrderRequest = {
  quantity: number;
  side: "BID" | "ASK";
};

export type LimitOrderRequest = {
  type: "limit";
  price: number;
} & BaseOrderRequest;

export type MarketOrderRequest = {
  type: "market";
} & BaseOrderRequest;

export type OrderRequest = LimitOrderRequest | MarketOrderRequest;

export const isLimitOrderEntry = (
  orderEntry: OrderRequest
): orderEntry is LimitOrderRequest => {
  return orderEntry.type === "limit";
};

export const isMarketOrderEntry = (
  orderEntry: OrderRequest
): orderEntry is MarketOrderRequest => {
  return orderEntry.type === "market";
};
