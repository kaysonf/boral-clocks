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
  let ret = a.getPrice() - b.getPrice();
  if (ret == 0) {
    ret = a.getSeqNo() - b.getSeqNo();
  }
  return ret;
};

const bidComparator = (a: IOrderCore, b: IOrderCore) => {
  let ret = b.getPrice() - a.getPrice();
  if (ret == 0) {
    ret = a.getSeqNo() - b.getSeqNo();
  }
  return ret;
};

export class MatchingEngine {
  private bids: PriorityQueue<IOrderCore>;
  private asks: PriorityQueue<IOrderCore>;

  private lastTransactedBid = BEST_PRICE.ASK;
  private lastTransactedAsk = BEST_PRICE.BID;

  constructor(private _generateId: () => string) {
    this.bids = new PriorityQueue<IOrderCore>(bidComparator);
    this.asks = new PriorityQueue<IOrderCore>(askComparator);
  }

  public createOrder = (
    orderRequest: Sequenced<OrderRequest>
  ): SequencedOrder => {
    let order: IOrderCore;

    switch (orderRequest.type) {
      case "limit": {
        order = new LimitOrder(orderRequest, this._generateId(), "ACTIVE");

        break;
      }

      case "market": {
        order = new MarketOrder(
          orderRequest,
          this._generateId(),
          "ACTIVE",
          orderRequest.side === "ASK"
            ? this.getMarketAskPrice
            : this.getMarketBidPrice
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

    let priceLevels = this.priceLevelsOverlap();

    while (priceLevels.overlap) {
      const { bestAsk, bestBid } = priceLevels;

      // this.lastTransactedAskPrice = bestAsk.getPrice();
      // this.lastTransactedBidPrice = bestBid.getPrice();

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

        const askCameFirst = bestAsk.getSeqNo() < bestBid.getSeqNo();

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

        const askCameFirst = bestAsk.getSeqNo() < bid.getSeqNo();

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

        const askCameFirst = ask.getSeqNo() < bestBid.getSeqNo();

        const first = askCameFirst ? askFulfilled : bidFulfilled;
        const second = askCameFirst ? bidFulfilled : askFulfilled;

        ordersFulfilled.push(first);
        ordersFulfilled.push(second);
      }

      priceLevels = this.priceLevelsOverlap();
    }

    return ordersFulfilled;
  };

  private getMarketAskPrice = () => {
    const bestBid = this.bids.peek();

    const onlyMarketOrders = bestBid?.getType() === "market";

    if (bestBid === undefined || onlyMarketOrders) {
      return BEST_PRICE.ASK;
    }

    return bestBid.getPrice();
  };

  private getMarketBidPrice = () => {
    const bestAsk = this.asks.peek();

    const onlyMarketOrders = bestAsk?.getType() === "market";

    if (bestAsk === undefined || onlyMarketOrders) {
      return BEST_PRICE.BID;
    }

    return bestAsk.getPrice();
  };

  private priceLevelsOverlap = ():
    | { overlap: true; bestAsk: IOrderCore; bestBid: IOrderCore }
    | { overlap: false } => {
    const bestBid = this.bids.peek();
    const bestAsk = this.asks.peek();

    if (bestBid === undefined || bestAsk === undefined) {
      return { overlap: false };
    }

    if (bestAsk.getPrice() <= bestBid.getPrice()) {
      return { overlap: true, bestAsk, bestBid };
    }

    return { overlap: false };
  };
}
