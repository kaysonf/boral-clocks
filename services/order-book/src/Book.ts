import { OrderRequest } from "./models/OrderRequest";
import { createOrder } from "./orders/createOrder";
import { Order } from "./orders/types";
import { SystemConfig } from "./system";
import { PriorityQueue } from "./utils";

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

// add orders, earn spread
export class Book {
  private symbol: string;
  private bids: PriorityQueue<Order>;
  private asks: PriorityQueue<Order>;
  private systemConfig: SystemConfig;

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

  public submitOrderRequest = (orderRequest: OrderRequest) => {
    const order = createOrder({
      orderRequest: orderRequest,
      bids: this.bids,
      asks: this.asks,
      systemConfig: this.systemConfig,
    });

    // TODO check can execute trade

    if (order.status === "success") {
      const { data } = order;
      switch (data.side) {
        case "BID": {
          this.bids.enqueue(data);
          break;
        }

        case "ASK": {
          this.asks.enqueue(data);
          break;
        }
      }
    }
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
}
