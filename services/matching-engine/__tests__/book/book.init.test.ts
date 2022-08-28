import { Book } from "../../src/book/Book";

describe("on init", () => {

  const book = new Book();

  test("bids is empty", () => expect(book.getBids().size()).toStrictEqual(0));

  test("asks is empty", () => expect(book.getAsks().size()).toStrictEqual(0));

  test("book has no spread", () => expect(book.getSpread()).toBeUndefined());
});