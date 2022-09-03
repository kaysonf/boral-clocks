import { OrderRequest } from "../models/OrderRequest";
import { IOrderCore, LimitOrder, MarketOrder, Order } from "../order";
import { OperationResult, Sequenced } from "../system";
import { PriorityQueue } from "../utils";

type SequencedOrder = Sequenced<Order>;

const askComparator = (a: IOrderCore, b: IOrderCore) => {
  let ret = a.toOrder().price - b.toOrder().price;
  if (ret == 0) {
    ret = a.toOrder().seq_no - b.toOrder().seq_no;
  }
  return ret;
};

const bidComparator = (a: IOrderCore, b: IOrderCore) => {
  let ret = b.toOrder().price - a.toOrder().price;
  if (ret == 0) {
    ret = a.toOrder().seq_no - b.toOrder().seq_no;
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
  ): OperationResult<SequencedOrder> => {
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

    switch (order.toOrder().side) {
      case "ASK": {
        this.asks.enqueue(order);
        break;
      }

      case "BID": {
        this.bids.enqueue(order);
        break;
      }
    }

    return {
      status: "success",
      data: order.toOrder(),
    };
  };

  private bestAskPrice = () => {
    const bestBid = this.bids.peek();

    const onlyMarketOrders = bestBid?.getType() === "market";

    if (bestBid === undefined || onlyMarketOrders) {
      return -Infinity;
    }

    return bestBid.toOrder().price;
  };

  private bestBidPrice = () => {
    const bestAsk = this.asks.peek();

    const onlyMarketOrders = bestAsk?.getType() === "market";

    if (bestAsk === undefined || onlyMarketOrders) {
      return Infinity;
    }

    return bestAsk.toOrder().price;
  };
}
