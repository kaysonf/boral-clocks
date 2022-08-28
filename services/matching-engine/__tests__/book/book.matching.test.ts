import { Book } from "../../src/book/Book";
import { Order } from "../../src/models/Order";
import { LimitOrderRequest, MarketOrderRequest } from "../../src/models/OrderRequest";

describe("matching engine", () => {

    let book: Book = new Book();

    beforeEach(() => {

        book = new Book();
    });

    // TODO
    test.skip("[BID] MARKET orders will transact with the best available prices", () => {

        const limitOrder1: LimitOrderRequest = {
            type: "limit",
            side: "BID",
            quantity: 3,
            price: 1,
        };

        const limitOrder2: LimitOrderRequest = {
            type: "limit",
            side: "BID",
            quantity: 5,
            price: 2,
        };

        const transactions: { ask: Order, bid: Order }[] = [];

        book.onEvent = (e) => {
            if (e.type === "transaction") {
                transactions.push(e.data)
            }
        }

        book.submitOrderRequest(limitOrder1)
        book.submitOrderRequest(limitOrder2)

        const marketOrder: MarketOrderRequest = {
            type: "market",
            side: "ASK",
            quantity: 7,
        }

        book.submitOrderRequest(marketOrder)


        const expectedTransactions: { ask: Order, bid: Order }[] = [
            {
                ask: {
                    seq_no: 4,
                    price: limitOrder1.price,
                    type: "market",
                    side: "ASK",
                    status: "ACTIVE",
                    quantity: limitOrder1.quantity,
                },

                bid: {
                    seq_no: 5,
                    type: "limit",
                    side: "BID",
                    status: "FILLED",
                    quantity: limitOrder1.quantity,
                    price: limitOrder1.price,
                }
            },
            {
                ask: {
                    seq_no: 6,
                    price: limitOrder2.price,
                    type: "market",
                    side: "ASK",
                    status: "FILLED",
                    quantity: marketOrder.quantity - limitOrder1.quantity,
                },

                bid: {
                    seq_no: 7,
                    type: "limit",
                    side: "BID",
                    status: "ACTIVE",
                    quantity: limitOrder2.quantity - marketOrder.quantity - limitOrder1.quantity,
                    price: limitOrder2.price,
                }
            }
        ]

        expect(transactions).toStrictEqual(expectedTransactions)

    })

    test("spread is present only when there is at least one order in bids and asks", () => {
        const askOrder: LimitOrderRequest = {
            type: "limit",
            side: "ASK",
            quantity: 1,
            price: 2,
        };

        book.submitOrderRequest(askOrder)

        expect(book.getSpread()).toBeUndefined()

        const bidOrder: LimitOrderRequest = {
            type: "limit",
            side: "BID",
            quantity: 1,
            price: 1,
        };
        book.submitOrderRequest(bidOrder)

        expect(book.getSpread()).toStrictEqual(1)

        const removeAskOrder = () => book.getAsks().dequeue();

        removeAskOrder();

        expect(book.getSpread()).toBeUndefined()
    })

})