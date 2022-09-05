import { Sequenced } from "@core/sequencer";
import { OperationResult } from "@core/system";
import { OrderRequest } from "@matching-engine/models";
import {
  IOrderCore,
  LimitOrder,
  MarketOrder,
  Order,
  OrderFilled,
} from "@matching-engine/order";

import { PriorityQueue } from "@matching-engine/utils";
import * as OrderManager from "./OrderManager";

type SequencedOrder = Sequenced<Order>;

const askComparator = (a: IOrderCore, b: IOrderCore) => {
  let ret = a.getPrice() - b.getPrice();
  if (ret === 0) {
    ret = a.getSeqNo() - b.getSeqNo();
  }
  return ret;
};

const bidComparator = (a: IOrderCore, b: IOrderCore) => {
  let ret = b.getPrice() - a.getPrice();
  if (ret === 0) {
    ret = a.getSeqNo() - b.getSeqNo();
  }
  return ret;
};

export class MatchingEngine {
  private asks: PriorityQueue<IOrderCore>;
  private bids: PriorityQueue<IOrderCore>;

  private lastAskPrice: number;
  private lastBidPrice: number;

  private orderMap = new Map<Order["id"], IOrderCore>();

  constructor(private _generateId: () => string, marketPrice: number) {
    this.asks = new PriorityQueue<IOrderCore>(askComparator);
    this.bids = new PriorityQueue<IOrderCore>(bidComparator);

    this.lastAskPrice = marketPrice;
    this.lastBidPrice = marketPrice;
  }

  public createOrder = (
    orderRequest: Sequenced<OrderRequest>
  ): SequencedOrder => {
    const order = this.createOrderType(orderRequest);

    this.enqueueOrder(order);

    return order.toSerialized();
  };

  public cancelOrder = (id: Order["id"]): OperationResult<string> => {
    const order = this.orderMap.get(id);

    if (order === undefined) {
      return { status: "failure", message: "order not found" };
    } else {
      order.setStatus("CANCELLED");
      return { status: "success", data: `order ${id} cancelled` };
    }
  };

  public settle = (): OrderFilled[] => {
    const ordersFulfilled: OrderFilled[] = [];

    let bestAsk = this.asks.peek();
    let bestBid = this.bids.peek();

    const next = () => {
      bestAsk = this.asks.peek();
      bestBid = this.bids.peek();
    };

    while (
      bestAsk !== undefined &&
      bestBid !== undefined &&
      OrderManager.priceLevelsOverlap(bestAsk, bestBid)
    ) {
      if (bestAsk.getStatus() === "CANCELLED") {
        this.asks.dequeue();
        next();
        continue;
      }

      if (bestBid.getStatus() === "CANCELLED") {
        this.bids.dequeue();
        next();
        continue;
      }

      const { askFilled, bidFilled } = OrderManager.matchOrders(
        bestAsk,
        bestBid
      );

      const askCameFirst = bestAsk.getSeqNo() < bestBid.getSeqNo();
      const first = askCameFirst ? askFilled : bidFilled;
      const second = askCameFirst ? bidFilled : askFilled;
      ordersFulfilled.push(first);
      ordersFulfilled.push(second);

      this.removeFilledOrders();

      this.updateMarketPrices(bestBid, bestAsk);

      next();
    }

    return ordersFulfilled;
  };

  private createOrderType(orderRequest: Sequenced<OrderRequest>) {
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
            ? () => this.lastAskPrice
            : () => this.lastBidPrice
        );

        break;
      }
    }
    return order;
  }

  private enqueueOrder(order: IOrderCore) {
    this.orderMap.set(order.getId(), order);

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
  }

  private updateMarketPrices(bestBid: IOrderCore, bestAsk: IOrderCore) {
    this.lastBidPrice = bestBid.getPrice();
    this.lastAskPrice = bestAsk.getPrice();
  }

  private removeFilledOrders() {
    const bestAsk = this.asks.peek();

    if (bestAsk !== undefined && bestAsk.getStatus() === "FILLED") {
      this.orderMap.delete(bestAsk.getId());
      this.asks.dequeue();
    }

    const bestBid = this.bids.peek();
    if (bestBid !== undefined && bestBid.getStatus() === "FILLED") {
      this.orderMap.delete(bestBid.getId());
      this.bids.dequeue();
    }
  }
}
