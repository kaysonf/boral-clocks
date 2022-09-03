import { BEST_PRICE, MatchingEngine } from "../src/engine";
import {
  LimitOrderRequest,
  MarketOrderRequest,
} from "../src/models/OrderRequest";

import { Order } from "../src/order";
import { Sequenced } from "../src/system";

describe("matching engine creating orders", () => {
  let id = 0;
  const idGenFn = () => String(++id);
  let matchingEngine = new MatchingEngine(idGenFn);

  let seq_no = 0;
  const nextSeq = () => ++seq_no;

  beforeEach(() => {
    id = 0;
    seq_no = 0;

    matchingEngine = new MatchingEngine(idGenFn);
  });

  test("should create LIMIT orders succesfully", () => {
    const askLimitOrderRequest: Sequenced<LimitOrderRequest> = {
      seq_no: nextSeq(),
      type: "limit",
      price: 1,
      quantity: 1,
      side: "ASK",
    };

    const order = matchingEngine.createOrder(askLimitOrderRequest);

    const expectedOrder: Sequenced<Order> = {
      ...askLimitOrderRequest,
      price: 1,
      id: "1",
      status: "ACTIVE",
    };

    expect(order).toStrictEqual(expectedOrder);
  });

  test("should create MARKET orders succesfully - no LIMIT orders in market", () => {
    const askMarketOrderRequest: Sequenced<MarketOrderRequest> = {
      seq_no: nextSeq(),
      type: "market",
      quantity: 1,
      side: "ASK",
    };

    const askOrder = matchingEngine.createOrder(askMarketOrderRequest);
    const expectedAskOrder: Sequenced<Order> = {
      ...askMarketOrderRequest,
      price: BEST_PRICE.ASK,
      id: "1",
      status: "ACTIVE",
    };

    expect(askOrder).toStrictEqual(expectedAskOrder);

    const bidMarketOrderRequest: Sequenced<MarketOrderRequest> = {
      seq_no: nextSeq(),
      type: "market",
      quantity: 1,
      side: "BID",
    };

    const bidOrder = matchingEngine.createOrder(bidMarketOrderRequest);

    const expectedBidOrder: Sequenced<Order> = {
      ...bidMarketOrderRequest,
      price: BEST_PRICE.BID,
      id: "2",
      status: "ACTIVE",
    };

    expect(bidOrder).toStrictEqual(expectedBidOrder);
  });

  test("should create MARKET orders succesfully - LIMIT orders in market", () => {
    const bidLimitOrderRequest: Sequenced<LimitOrderRequest> = {
      seq_no: nextSeq(),
      type: "limit",
      price: 1,
      quantity: 1,
      side: "BID",
    };

    matchingEngine.createOrder(bidLimitOrderRequest);

    const askMarketOrderRequest: Sequenced<MarketOrderRequest> = {
      seq_no: nextSeq(),
      type: "market",
      quantity: 1,
      side: "ASK",
    };

    const order = matchingEngine.createOrder(askMarketOrderRequest);

    const expectedOrder: Sequenced<Order> = {
      ...askMarketOrderRequest,
      price: bidLimitOrderRequest.price,
      id: "2",
      status: "ACTIVE",
    };

    expect(order).toStrictEqual(expectedOrder);
  });
});
