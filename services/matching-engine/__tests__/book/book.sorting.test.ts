import { Book } from "../../src/book/Book";
import { Order } from "../../src/models/Order";
import { LimitOrderRequest } from "../../src/models/OrderRequest";


describe("on adding orders", () => {

  let book: Book = new Book();

  beforeEach(() => {
    book = new Book();
  });

  test("[BID] LIMIT orders are sorted by descending price", () => {
    const CONSTANTS: Omit<LimitOrderRequest, "price"> = {
      type: "limit",
      side: "BID",
      quantity: 1,
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
    const actualOrders = book.getBids().items().map(extractOrderingRelatedData);

    expect(actualOrders).toStrictEqual(ordersSortedByPrice);
  });

  test("[BID] LIMIT orders are sorted by ascending seq_no if price is the same", () => {
    const CONSTANTS: LimitOrderRequest = {
      type: "limit",
      side: "BID",
      quantity: 1,
      price: 1,
    };

    const orderThatComesInFirst: LimitOrderRequest = {
      ...CONSTANTS,
    };

    book.submitOrderRequest(orderThatComesInFirst);

    const orderThatComesInSecond: LimitOrderRequest = {
      ...CONSTANTS,
    };

    book.submitOrderRequest(orderThatComesInSecond);

    const extractOrderingRelatedData = (
      order: Pick<Order, "price" | "seq_no">
    ) => ({
      price: order.price,
      seq_no: order.seq_no,
    });

    const samePriceOrdersSortedByTimeStamp = [
      { price: 1, seq_no: 1 },
      { price: 1, seq_no: 2 },
    ];

    const actualOrders = book.getBids().items().map(extractOrderingRelatedData);

    expect(actualOrders).toStrictEqual(samePriceOrdersSortedByTimeStamp);
  });


  test("[ASK] LIMIT orders are sorted by ascending price", () => {
    const CONSTANTS: Omit<LimitOrderRequest, "price"> = {
      type: "limit",
      side: "ASK",
      quantity: 1,
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
    const actualOrders = book.getAsks().items().map(extractOrderingRelatedData);

    expect(actualOrders).toStrictEqual(ordersSortedByPrice);
  });

  test("[ASK] LIMIT orders are sorted by ascending seq_no if price is the same", () => {
    const CONSTANTS: LimitOrderRequest = {
      type: "limit",
      side: "ASK",
      quantity: 1,
      price: 1,
    };

    const orderThatComesInFirst: LimitOrderRequest = {
      ...CONSTANTS,
    };

    book.submitOrderRequest(orderThatComesInFirst);

    const orderThatComesInSecond: LimitOrderRequest = {
      ...CONSTANTS,
    };

    book.submitOrderRequest(orderThatComesInSecond);

    const extractOrderingRelatedData = (
      order: Pick<Order, "price" | "seq_no">
    ) => ({
      price: order.price,
      seq_no: order.seq_no,
    });

    const samePriceOrdersSortedByTimeStamp = [
      { price: 1, seq_no: 1 },
      { price: 1, seq_no: 2 },
    ];

    const actualOrders = book.getAsks().items().map(extractOrderingRelatedData);

    expect(actualOrders).toStrictEqual(samePriceOrdersSortedByTimeStamp);
  });

});
