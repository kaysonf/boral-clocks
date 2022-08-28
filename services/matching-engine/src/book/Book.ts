import { BookEvent } from "../models/BookEvent";
import { Order } from "../models/Order";
import { OrderRequest } from "../models/OrderRequest";
import { OperationResult } from "../system";
import { PriorityQueue } from "../utils";

const askComparator = (a: Order, b: Order) => {
  let ret = a.price - b.price;
  if (ret == 0) {
    ret = a.seq_no - b.seq_no;
  }
  return ret;
};

const bidComparator = (a: Order, b: Order) => {
  let ret = b.price - a.price;
  if (ret == 0) {
    ret = a.seq_no - b.seq_no;
  }
  return ret;
};

export class Book {
  private bids: PriorityQueue<Order>;
  private asks: PriorityQueue<Order>;

  private sequenceNumber = 0;

  public onEvent?: (e: BookEvent) => void;

  constructor() {
    this.bids = new PriorityQueue<Order>(bidComparator);
    this.asks = new PriorityQueue<Order>(askComparator);
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

  public getBids = () => this.bids as Readonly<PriorityQueue<Order>>;
  public getAsks = () => this.asks as Readonly<PriorityQueue<Order>>;

  private createOrder = (
    orderRequest: OrderRequest
  ): OperationResult<Order> => {
    switch (orderRequest.type) {
      case "limit": {
        return {
          status: "success",
          data: {
            ...orderRequest,
            seq_no: this.getUpdatedSeqNo(),
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
            seq_no: this.getUpdatedSeqNo(),
            status: "ACTIVE",
            price: marketPriceResult.data,
          },
        };
      }
    }
  };

  private getUpdatedSeqNo = () => ++this.sequenceNumber;

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
