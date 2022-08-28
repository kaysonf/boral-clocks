import { LimitOrderRequest, MarketOrderRequest } from "../models/OrderRequest";
import { SystemConfig } from "../system";
import { CreateOrder, Order } from "./types";

const createLimitOrder = (
  orderRequest: LimitOrderRequest,
  systemConfig: SystemConfig
): Order => {
  return {
    ...orderRequest,

    id: systemConfig.getOrderId(),
    timestamp: systemConfig.getCurrentTimestamp(),
    status: "ACTIVE",
  };
};

// TODO
const createMarketOrder = (orderRequest: MarketOrderRequest): Order => {
  return {
    id: "1",
    timestamp: 1,
    status: "ACTIVE",
    type: "market",
    price: 1,
    quantity: orderRequest.quantity,
    symbol: "1",
    side: "ASK",
    owner: "kayson",
  };
};

export const createOrder: CreateOrder = (params) => {
  const { orderRequest, systemConfig } = params;

  switch (orderRequest.type) {
    case "limit": {
      return {
        status: "success",
        data: createLimitOrder(orderRequest, systemConfig),
      };
    }

    case "market": {
      return { status: "success", data: createMarketOrder(orderRequest) };
    }

    default: {
      return {
        status: "failure",
        message: "unhandled order request type",
      };
    }
  }
};
