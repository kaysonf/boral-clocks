import { BookEvent } from "../models/BookEvent";
import { Order } from "../models/Order";
import { OrderRequest } from "../models/OrderRequest";
import { OperationResult, SystemConfig } from "../system";
import { PriorityQueue } from "../utils";

export const askComparator = (a: Order, b: Order) => {
  let ret = a.price - b.price;
  if (ret == 0) {
    ret = a.timestamp - b.timestamp;
  }
  return ret;
};

export const bidComparator = (a: Order, b: Order) => {
  let ret = b.price - a.price;
  if (ret == 0) {
    ret = a.timestamp - b.timestamp;
  }
  return ret;
};

export class Book {
  private symbol: string;
  private bids: PriorityQueue<Order>;
  private asks: PriorityQueue<Order>;
  private systemConfig: SystemConfig;

  public onEvent?: (e: BookEvent) => void;

  constructor(params: {
    symbol: string;

    bids: PriorityQueue<Order>;
    asks: PriorityQueue<Order>;

    systemConfig: SystemConfig;
  }) {
    this.symbol = params.symbol;
    this.bids = params.bids;
    this.asks = params.asks;
    this.systemConfig = params.systemConfig;
  }

  public submitOrderRequest = (
    orderRequest: OrderRequest
  ): OperationResult<Order> => {
    const orderResult = this.createOrder(orderRequest);

    if (orderResult.status === "success") {
      const { data: order } = orderResult;

      switch (order.side) {
        case "BID": {
          this.bids.enqueue(order);
          break;
        }

        case "ASK": {
          this.asks.enqueue(order);
          break;
        }
      }

      // TODO check transaction
    }

    return orderResult;
  };

  // TODO
  // public cancelOrder = (order: Order) => {};

  public getSpread = () => {
    const bestAsk = this.asks.peek();
    const bestBid = this.bids.peek();

    if (bestAsk === undefined || bestBid === undefined) {
      return undefined;
    }

    return bestAsk.price - bestBid.price;
  };

  public getSymbol = () => this.symbol;

  private createOrder = (
    orderRequest: OrderRequest
  ): OperationResult<Order> => {
    switch (orderRequest.type) {
      case "limit": {
        return {
          status: "success",
          data: {
            ...orderRequest,
            id: this.systemConfig.getOrderId(),
            timestamp: this.systemConfig.getCurrentTimestamp(),
            status: "ACTIVE",
          },
        };
      }

      case "market": {
        const marketPriceResult = this.getMarketPrice(orderRequest.side);

        if (marketPriceResult.status === "failure") {
          return marketPriceResult;
        }

        return {
          status: "success",
          data: {
            ...orderRequest,
            id: this.systemConfig.getOrderId(),
            timestamp: this.systemConfig.getCurrentTimestamp(),
            status: "ACTIVE",
            price: marketPriceResult.data,
          },
        };
      }
    }
  };

  private getMarketPrice = (
    side: Order["side"]
  ): OperationResult<Order["price"]> => {
    switch (side) {
      case "ASK": {
        const bestBidPrice = this.bids.peek()?.price;

        if (bestBidPrice === undefined) {
          return {
            status: "failure",
            message: "no bids in market",
          };
        } else {
          return { status: "success", data: bestBidPrice };
        }
      }

      case "BID": {
        const bestAskPrice = this.asks.peek()?.price;

        if (bestAskPrice === undefined) {
          return {
            status: "failure",
            message: "no asks in market",
          };
        } else {
          return { status: "success", data: bestAskPrice };
        }
      }
    }
  };
}
