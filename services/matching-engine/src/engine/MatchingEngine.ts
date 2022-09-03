import { OrderRequest } from "../models/OrderRequest";
import {
  IOrderCore,
  LimitOrder,
  MarketOrder,
  Order,
  OrderFulfilled,
} from "../order";
import { Sequenced } from "../system";
import { PriorityQueue } from "../utils";
import { BEST_PRICE } from "./constants";

type SequencedOrder = Sequenced<Order>;

const askComparator = (a: IOrderCore, b: IOrderCore) => {
  let ret = a.toSerialized().price - b.toSerialized().price;
  if (ret == 0) {
    ret = a.toSerialized().seq_no - b.toSerialized().seq_no;
  }
  return ret;
};

const bidComparator = (a: IOrderCore, b: IOrderCore) => {
  let ret = b.toSerialized().price - a.toSerialized().price;
  if (ret == 0) {
    ret = a.toSerialized().seq_no - b.toSerialized().seq_no;
  }
  return ret;
};

export class MatchingEngine {
  private bids: PriorityQueue<IOrderCore>;
  private asks: PriorityQueue<IOrderCore>;

  constructor(private _idGen: () => string) {
    this.bids = new PriorityQueue<IOrderCore>(bidComparator);
    this.asks = new PriorityQueue<IOrderCore>(askComparator);
  }

  public createOrder = (
    orderRequest: Sequenced<OrderRequest>
  ): SequencedOrder => {
    let order: IOrderCore;

    switch (orderRequest.type) {
      case "limit": {
        order = new LimitOrder(orderRequest, this._idGen(), "ACTIVE");

        break;
      }

      case "market": {
        order = new MarketOrder(
          orderRequest,
          this._idGen(),
          "ACTIVE",
          orderRequest.side === "ASK" ? this.bestAskPrice : this.bestBidPrice
        );

        break;
      }
    }

    switch (order.getSide()) {
      case "ASK": {
        this.asks.enqueue(order);
        break;
      }

      case "BID": {
        this.bids.enqueue(order);
        break;
      }
    }

    return order.toSerialized();
  };

  public settle = (): OrderFulfilled[] => {
    const ordersFulfilled: OrderFulfilled[] = [];

    let transactionStatus = this.getTransactionStatus();

    while (transactionStatus.canTransact) {
      const { bestAsk, bestBid } = transactionStatus;

      if (bestAsk.getCurrentQuantity() === bestBid.getCurrentQuantity()) {
        const bid = this.bids.dequeue();
        const ask = this.asks.dequeue();

        if (bid === undefined || ask === undefined) {
          // impossible
          break;
        }

        const askFulfilled = {
          id: ask.getId(),
          side: ask.getSide(),
          quantity: ask.getCurrentQuantity(),
          price: ask.getPrice(),
        };

        const bidFulfilled = {
          id: bid.getId(),
          side: bid.getSide(),
          quantity: bid.getCurrentQuantity(),
          price: bid.getPrice(),
        };

        const askCameFirst =
          bestAsk.toSerialized().seq_no < bestBid.toSerialized().seq_no;

        const first = askCameFirst ? askFulfilled : bidFulfilled;
        const second = askCameFirst ? bidFulfilled : askFulfilled;

        ordersFulfilled.push(first);
        ordersFulfilled.push(second);
      } else if (bestAsk.getCurrentQuantity() > bestBid.getCurrentQuantity()) {
        const bid = this.bids.dequeue();

        if (bid === undefined) {
          // impossible
          break;
        }

        bestAsk.decreaseQuantity(bid.getCurrentQuantity());
        const askFulfilled = {
          id: bestAsk.getId(),
          side: bestAsk.getSide(),
          quantity: bid.getCurrentQuantity(),
          price: bestAsk.getPrice(),
        };

        const bidFulfilled = {
          id: bid.getId(),
          side: bid.getSide(),
          quantity: bid.getCurrentQuantity(),
          price: bid.getPrice(),
        };

        const askCameFirst =
          bestAsk.toSerialized().seq_no < bid.toSerialized().seq_no;

        const first = askCameFirst ? askFulfilled : bidFulfilled;
        const second = askCameFirst ? bidFulfilled : askFulfilled;

        ordersFulfilled.push(first);
        ordersFulfilled.push(second);
      } else {
        const ask = this.asks.dequeue();

        if (ask === undefined) {
          break;
        }

        bestBid.decreaseQuantity(ask.getCurrentQuantity());
        const bidFulfilled = {
          id: bestBid.getId(),
          side: bestBid.getSide(),
          quantity: ask.getCurrentQuantity(),
          price: bestBid.getPrice(),
        };

        const askFulfilled = {
          id: ask.getId(),
          side: ask.getSide(),
          quantity: ask.getCurrentQuantity(),
          price: ask.getPrice(),
        };

        const askCameFirst =
          ask.toSerialized().seq_no < bestBid.toSerialized().seq_no;

        const first = askCameFirst ? askFulfilled : bidFulfilled;
        const second = askCameFirst ? bidFulfilled : askFulfilled;

        ordersFulfilled.push(first);
        ordersFulfilled.push(second);
      }

      transactionStatus = this.getTransactionStatus();
    }

    return ordersFulfilled;
  };

  private bestAskPrice = () => {
    const bestBid = this.bids.peek();

    const onlyMarketOrders = bestBid?.getType() === "market";

    if (bestBid === undefined || onlyMarketOrders) {
      return BEST_PRICE.ASK;
    }

    return bestBid.toSerialized().price;
  };

  private bestBidPrice = () => {
    const bestAsk = this.asks.peek();

    const onlyMarketOrders = bestAsk?.getType() === "market";

    if (bestAsk === undefined || onlyMarketOrders) {
      return BEST_PRICE.BID;
    }

    return bestAsk.toSerialized().price;
  };

  private getTransactionStatus = ():
    | { canTransact: true; bestAsk: IOrderCore; bestBid: IOrderCore }
    | { canTransact: false } => {
    const bestBid = this.bids.peek();
    const bestAsk = this.asks.peek();

    if (bestBid === undefined || bestAsk === undefined) {
      return { canTransact: false };
    }

    if (bestAsk.getPrice() <= bestBid.getPrice()) {
      return { canTransact: true, bestAsk, bestBid };
    }

    return { canTransact: false };
  };
}
