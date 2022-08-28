import { askComparator, bidComparator, Book } from "../../src/book/Book";
import { Order } from "../../src/models/Order";
import { LimitOrderRequest, MarketOrderRequest } from "../../src/models/OrderRequest";
import { PriorityQueue } from "../../src/utils";


describe("on adding orders", () => {
  let bids: PriorityQueue<Order> = new PriorityQueue<Order>(bidComparator);
  let asks: PriorityQueue<Order> = new PriorityQueue<Order>(askComparator);

  const systemConfig = {
    getCurrentTimestamp: jest.fn().mockReturnValue(0),
    getOrderId: jest.fn().mockReturnValue("0"),
  };

  let book: Book = new Book({ symbol: "BTCUSD", bids, asks, systemConfig });

  beforeEach(() => {
    bids = new PriorityQueue<Order>(bidComparator);
    asks = new PriorityQueue<Order>(askComparator);

    book = new Book({ symbol: "BTCUSD", bids, asks, systemConfig });
  });

  test("[BID] LIMIT orders are sorted by descending price", () => {
    const CONSTANTS: Omit<LimitOrderRequest, "price"> = {
      type: "limit",
      side: "BID",
      quantity: 1,
      symbol: "BTCUSD",
      owner: "kayson",
    };

    const lowerPrice = 1;
    const higherPrice = 2;

    const lowerPriceOrder: LimitOrderRequest = {
      ...CONSTANTS,
      price: lowerPrice,
    };
    book.submitOrderRequest(lowerPriceOrder);

    const higherPriceOrder: LimitOrderRequest = {
      ...CONSTANTS,
      price: higherPrice,
    };
    book.submitOrderRequest(higherPriceOrder);

    const extractOrderingRelatedData = (order: Pick<Order, "price">) => ({
      price: order.price,
    });

    const ordersSortedByPrice = [higherPriceOrder, lowerPriceOrder].map(
      extractOrderingRelatedData
    );
    const actualOrders = bids.items().map(extractOrderingRelatedData);

    expect(actualOrders).toStrictEqual(ordersSortedByPrice);
  });

  test("[BID] LIMIT orders are sorted by ascending time if price is the same", () => {
    const CONSTANTS: LimitOrderRequest = {
      type: "limit",
      side: "BID",
      quantity: 1,
      symbol: "BTCUSD",
      owner: "kayson",
      price: 1,
    };

    const orderThatComesInFirst: LimitOrderRequest = {
      ...CONSTANTS,
    };
    systemConfig.getCurrentTimestamp.mockImplementation(() => 1);
    systemConfig.getOrderId.mockImplementation(() => "1");
    book.submitOrderRequest(orderThatComesInFirst);

    const orderThatComesInSecond: LimitOrderRequest = {
      ...CONSTANTS,
    };
    systemConfig.getCurrentTimestamp.mockImplementation(() => 2);
    systemConfig.getOrderId.mockImplementation(() => "2");
    book.submitOrderRequest(orderThatComesInSecond);

    const extractOrderingRelatedData = (
      order: Pick<Order, "price" | "id" | "timestamp">
    ) => ({
      price: order.price,
      id: order.id,
      timestamp: order.timestamp,
    });

    const samePriceOrdersSortedByTimeStamp = [
      { price: 1, id: "1", timestamp: 1 },
      { price: 1, id: "2", timestamp: 2 },
    ];

    const actualOrders = bids.items().map(extractOrderingRelatedData);

    expect(actualOrders).toStrictEqual(samePriceOrdersSortedByTimeStamp);
  });

  test("[BID] MARKET orders will transact with the best available prices", () => {
    const limitOrder1: LimitOrderRequest = {
      type: "limit",
      side: "BID",
      quantity: 3,
      symbol: "BTCUSD",
      owner: "kayson",
      price: 1,
    };

    const limitOrder2: LimitOrderRequest = {
      type: "limit",
      side: "BID",
      quantity: 5,
      symbol: "BTCUSD",
      owner: "kayson",
      price: 2,
    };

    const transactions: { ask: Order, buy: Order }[] = [];

    book.onEvent = (e) => {
      if (e.type === "transaction") {
        transactions.push(e.data)
      }
    }

    book.submitOrderRequest(limitOrder1)
    book.submitOrderRequest(limitOrder2)

    const marketOrder: MarketOrderRequest = {
      type: "market",
      side: "BID",
      quantity: 7,
      symbol: "BTCUSD",
      owner: "kayson",
    }
    book.submitOrderRequest(marketOrder)


  })

  test("[ASK] LIMIT orders are sorted by ascending  price", () => {
    const CONSTANTS: Omit<LimitOrderRequest, "price"> = {
      type: "limit",
      side: "ASK",
      quantity: 1,
      symbol: "BTCUSD",
      owner: "kayson",
    };

    const lowerPrice = 1;
    const higherPrice = 2;

    const lowerPriceOrder: LimitOrderRequest = {
      ...CONSTANTS,
      price: lowerPrice,
    };
    book.submitOrderRequest(lowerPriceOrder);

    const higherPriceOrder: LimitOrderRequest = {
      ...CONSTANTS,
      price: higherPrice,
    };
    book.submitOrderRequest(higherPriceOrder);

    const extractOrderingRelatedData = (order: Pick<Order, "price">) => ({
      price: order.price,
    });

    const ordersSortedByPrice = [lowerPriceOrder, higherPriceOrder].map(
      extractOrderingRelatedData
    );
    const actualOrders = asks.items().map(extractOrderingRelatedData);

    expect(actualOrders).toStrictEqual(ordersSortedByPrice);
  });

  test("[ASK] LIMIT orders are sorted by ascending time if price is the same", () => {
    const CONSTANTS: LimitOrderRequest = {
      type: "limit",
      side: "ASK",
      quantity: 1,
      symbol: "BTCUSD",
      owner: "kayson",
      price: 1,
    };

    const orderThatComesInFirst: LimitOrderRequest = {
      ...CONSTANTS,
    };
    systemConfig.getCurrentTimestamp.mockImplementation(() => 1);
    systemConfig.getOrderId.mockImplementation(() => "1");
    book.submitOrderRequest(orderThatComesInFirst);

    const orderThatComesInSecond: LimitOrderRequest = {
      ...CONSTANTS,
    };
    systemConfig.getCurrentTimestamp.mockImplementation(() => 2);
    systemConfig.getOrderId.mockImplementation(() => "2");
    book.submitOrderRequest(orderThatComesInSecond);

    const extractOrderingRelatedData = (
      order: Pick<Order, "price" | "id" | "timestamp">
    ) => ({
      price: order.price,
      id: order.id,
      timestamp: order.timestamp,
    });

    const samePriceOrdersSortedByTimeStamp = [
      { price: 1, id: "1", timestamp: 1 },
      { price: 1, id: "2", timestamp: 2 },
    ];

    const actualOrders = asks.items().map(extractOrderingRelatedData);

    expect(actualOrders).toStrictEqual(samePriceOrdersSortedByTimeStamp);
  });

});
