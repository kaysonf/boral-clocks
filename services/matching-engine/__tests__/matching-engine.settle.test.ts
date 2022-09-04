import { MatchingEngine } from "../src/engine";
import {
  LimitOrderRequest,
  MarketOrderRequest,
} from "../src/models/OrderRequest";
import { OrderFulfilled } from "../src/order";
import { Sequenced } from "../src/system";

describe("matching engine settle", () => {
  let id = 0;
  const idGenFn = () => String(++id);
  const INIT_MARKET_PRICE = 1;
  let matchingEngine = new MatchingEngine(idGenFn, INIT_MARKET_PRICE);

  let seq_no = 0;
  const nextSeq = () => ++seq_no;

  beforeEach(() => {
    id = 0;
    seq_no = 0;

    matchingEngine = new MatchingEngine(idGenFn, 1);
  });

  test("should settle LIMIT orders in correct quantities", () => {
    const askLimitOrderRequest: Sequenced<LimitOrderRequest> = {
      seq_no: nextSeq(),
      type: "limit",
      price: 1,
      quantity: 2,
      side: "ASK",
    };

    matchingEngine.createOrder(askLimitOrderRequest);

    const bidLimitOrderRequest1: Sequenced<LimitOrderRequest> = {
      seq_no: nextSeq(),
      type: "limit",
      price: 2,
      quantity: 1,
      side: "BID",
    };

    matchingEngine.createOrder(bidLimitOrderRequest1);

    const ordersFulfilled1 = matchingEngine.settle();

    const expectedOrdersFulfilled1: OrderFulfilled[] = [
      {
        id: "1",
        side: askLimitOrderRequest.side,
        price: askLimitOrderRequest.price,
        quantity: bidLimitOrderRequest1.quantity, // because ask quantity > bid quantity
      },
      {
        id: "2",
        side: bidLimitOrderRequest1.side,
        price: bidLimitOrderRequest1.price,
        quantity: bidLimitOrderRequest1.quantity,
      },
    ];

    expect(ordersFulfilled1).toStrictEqual(expectedOrdersFulfilled1);

    const bidLimitOrderRequest2: Sequenced<LimitOrderRequest> = {
      seq_no: nextSeq(),
      type: "limit",
      price: 2,
      quantity: 4,
      side: "BID",
    };

    matchingEngine.createOrder(bidLimitOrderRequest2);

    const ordersFulfilled2 = matchingEngine.settle();

    const expectedOrdersFulfilled2: OrderFulfilled[] = [
      {
        id: "1",
        side: askLimitOrderRequest.side,
        price: askLimitOrderRequest.price,
        quantity:
          askLimitOrderRequest.quantity - bidLimitOrderRequest1.quantity, // from previous transaction
      },
      {
        id: "3",
        side: bidLimitOrderRequest2.side,
        price: bidLimitOrderRequest2.price,
        quantity:
          askLimitOrderRequest.quantity - bidLimitOrderRequest1.quantity, // from previous transaction
      },
    ];

    expect(ordersFulfilled2[1]).toStrictEqual(expectedOrdersFulfilled2[1]);
  });

  test("should settle MARKET orders in correct quantities - MARKET ONLY", () => {
    const askMarketOrderRequest: Sequenced<MarketOrderRequest> = {
      seq_no: nextSeq(),
      type: "market",
      quantity: 1,
      side: "ASK",
    };

    matchingEngine.createOrder(askMarketOrderRequest);

    const ordersFulfilled1 = matchingEngine.settle();

    const noOrdersFilled: OrderFulfilled[] = [];

    expect(ordersFulfilled1).toStrictEqual(noOrdersFilled);

    const bidMarketOrderRequest: Sequenced<MarketOrderRequest> = {
      seq_no: nextSeq(),
      type: "market",
      quantity: 2,
      side: "BID",
    };

    matchingEngine.createOrder(bidMarketOrderRequest);

    const ordersFulfilled2 = matchingEngine.settle();

    const expectedOrdersFulfilled: OrderFulfilled[] = [
      {
        id: "1",
        side: askMarketOrderRequest.side,
        price: INIT_MARKET_PRICE,
        quantity: askMarketOrderRequest.quantity, // from previous transaction
      },
      {
        id: "2",
        side: bidMarketOrderRequest.side,
        price: INIT_MARKET_PRICE,
        quantity: askMarketOrderRequest.quantity, // because ask quantity > bid quantity
      },
    ];

    expect(ordersFulfilled2).toStrictEqual(expectedOrdersFulfilled);
  });

  test("should settle MARKET orders in correct quantities - LIMIT AND MARKET", () => {
    const askMarketOrderRequest: Sequenced<MarketOrderRequest> = {
      seq_no: nextSeq(),
      type: "market",
      quantity: 2,
      side: "ASK",
    };

    matchingEngine.createOrder(askMarketOrderRequest);

    const HIGHER_THAN_INIT_PRICE = INIT_MARKET_PRICE + 1;

    const bidLimitOrderRequest1: Sequenced<LimitOrderRequest> = {
      seq_no: nextSeq(),
      type: "limit",
      price: HIGHER_THAN_INIT_PRICE,
      quantity: 1,
      side: "BID",
    };

    matchingEngine.createOrder(bidLimitOrderRequest1);

    const ordersFulfilled1 = matchingEngine.settle();

    const expectedOrdersFulfilled1: OrderFulfilled[] = [
      {
        id: "1",
        side: askMarketOrderRequest.side,
        price: INIT_MARKET_PRICE,
        quantity: bidLimitOrderRequest1.quantity,
      },
      {
        id: "2",
        side: bidLimitOrderRequest1.side,
        price: bidLimitOrderRequest1.price,
        quantity: bidLimitOrderRequest1.quantity,
      },
    ];

    expect(ordersFulfilled1).toStrictEqual(expectedOrdersFulfilled1);

    const bidMarketOrderRequest: Sequenced<MarketOrderRequest> = {
      seq_no: nextSeq(),
      type: "market",
      quantity: 2,
      side: "BID",
    };

    matchingEngine.createOrder(bidMarketOrderRequest);

    const ordersFulfilled2 = matchingEngine.settle();

    const expectedOrdersFulfilled2: OrderFulfilled[] = [
      {
        id: "1",
        side: askMarketOrderRequest.side,
        price: INIT_MARKET_PRICE,
        quantity: 1,
      },
      {
        id: "3",
        side: bidMarketOrderRequest.side,
        price: bidLimitOrderRequest1.price, // bidLimitOrderRequest1 is the highest bid transaction
        quantity: 1,
      },
    ];

    expect(ordersFulfilled2).toStrictEqual(expectedOrdersFulfilled2);

    const askLimitOrderRequest: Sequenced<LimitOrderRequest> = {
      seq_no: nextSeq(),
      type: "limit",
      price: HIGHER_THAN_INIT_PRICE,
      quantity: 1,
      side: "ASK",
    };

    matchingEngine.createOrder(askLimitOrderRequest);

    const ordersFulfilled3 = matchingEngine.settle();

    const expectedOrdersFulfilled3: OrderFulfilled[] = [
      {
        id: "3",
        side: bidLimitOrderRequest1.side,
        price: bidLimitOrderRequest1.price,
        quantity: 1,
      },
      {
        id: "4",
        side: askLimitOrderRequest.side,
        price: askLimitOrderRequest.price,
        quantity: 1,
      },
    ];

    expect(ordersFulfilled3).toStrictEqual(expectedOrdersFulfilled3);
  });
});
