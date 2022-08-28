import { askComparator, bidComparator, Book } from "../src/Book";
import { LimitOrderRequest } from "../src/models/OrderRequest";
import { Order } from "../src/orders/types";
import { PriorityQueue } from "../src/utils";

describe("on init", () => {
  const bids = new PriorityQueue<Order>(bidComparator);
  const asks = new PriorityQueue<Order>(askComparator);

  const systemConfig = {
    getCurrentTimestamp: jest.fn().mockReturnValue(0),
    getOrderId: jest.fn().mockReturnValue("0"),
  };

  const symbol = "BTCUSD";
  const book = new Book({ symbol, bids, asks, systemConfig });

  test("bids is empty", () => expect(bids.size()).toStrictEqual(0));

  test("asks is empty", () => expect(asks.size()).toStrictEqual(0));

  test("book has no spread", () => expect(book.getSpread()).toBeUndefined());

  test("book has correct symbol", () =>
    expect(book.getSymbol()).toStrictEqual(symbol));
});

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

  test("[bids] limit orders are sorted by descending price", () => {
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

    expect(actualOrders).toEqual(ordersSortedByPrice);
  });

  test("[bids] limit order entries are sorted by ascending time if price is the same", () => {
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

    expect(actualOrders).toEqual(samePriceOrdersSortedByTimeStamp);
  });
});
