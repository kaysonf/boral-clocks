import { MatchingEngine } from "../src/engine";
import { LimitOrderRequest } from "../src/models/OrderRequest";
import { OrderFulfilled } from "../src/order";
import { Sequenced } from "../src/system";

describe("matching engine settle", () => {
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
});
