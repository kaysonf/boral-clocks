import { askComparator, bidComparator, Book } from "../../src/book/Book";
import { Order } from "../../src/models/Order";
import { PriorityQueue } from "../../src/utils";

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