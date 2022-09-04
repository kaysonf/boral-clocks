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
  private asks: PriorityQueue<IOrderCore>;
  private bids: PriorityQueue<IOrderCore>;

  private lastAskPrice: number;
  private lastBidPrice: number;

  constructor(private _generateId: () => string, marketPrice: number) {
    this.asks = new PriorityQueue<IOrderCore>(askComparator);
    this.bids = new PriorityQueue<IOrderCore>(bidComparator);

    this.lastAskPrice = marketPrice;
    this.lastBidPrice = marketPrice;
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

      const { askFulfilled, bidFulfilled } = this.fillOrders(bestAsk, bestBid);

      const askCameFirst = bestAsk.getSeqNo() < bestBid.getSeqNo();
      const first = askCameFirst ? askFulfilled : bidFulfilled;
      const second = askCameFirst ? bidFulfilled : askFulfilled;
      ordersFulfilled.push(first);
      ordersFulfilled.push(second);

      this.removeFilledOrders(bestAsk, bestBid);

      this.updateLastPrices(bestBid, bestAsk);

      priceLevels = this.priceLevelsOverlap();
    }

    return ordersFulfilled;
  };

  private getMarketAskPrice = () => {
    return this.lastAskPrice;
  };

  private getMarketBidPrice = () => {
    return this.lastBidPrice;
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

  private updateLastPrices(bestBid: IOrderCore, bestAsk: IOrderCore) {
    this.lastBidPrice = bestBid.getPrice();
    this.lastAskPrice = bestAsk.getPrice();
  }

  private removeFilledOrders(bestAsk: IOrderCore, bestBid: IOrderCore) {
    if (bestAsk.getCurrentQuantity() === 0) {
      this.asks.dequeue();
    }

    if (bestBid.getCurrentQuantity() === 0) {
      this.bids.dequeue();
    }
  }

  private fillOrders(bestAsk: IOrderCore, bestBid: IOrderCore) {
    const quantityFilled = Math.min(
      bestAsk.getCurrentQuantity(),
      bestBid.getCurrentQuantity()
    );

    const askFulfilled = {
      id: bestAsk.getId(),
      side: bestAsk.getSide(),
      quantity: quantityFilled,
      price: bestAsk.getPrice(),
    };

    const bidFulfilled = {
      id: bestBid.getId(),
      side: bestBid.getSide(),
      quantity: quantityFilled,
      price: bestBid.getPrice(),
    };

    bestAsk.decreaseQuantity(quantityFilled);
    bestBid.decreaseQuantity(quantityFilled);
    return { askFulfilled, bidFulfilled };
  }
}
