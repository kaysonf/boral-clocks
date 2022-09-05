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
