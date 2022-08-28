import { askComparator, bidComparator, Book } from "../../src/book/Book";
import { Order } from "../../src/models/Order";
import { LimitOrderRequest, MarketOrderRequest } from "../../src/models/OrderRequest";
import { PriorityQueue } from "../../src/utils";

describe("matching engine", () => {
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

    // TODO
    test.skip("[BID] MARKET orders will transact with the best available prices", () => {

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
            symbol: "BTCUSD",
            owner: "kayson",
        }

        book.submitOrderRequest(marketOrder)


        const expectedTransactions: { ask: Order, bid: Order }[] = [
            {
                ask: {
                    id: "3",
                    timestamp: 3,
                    price: limitOrder1.price,
                    type: "market",
                    side: "ASK",
                    status: "ACTIVE",
                    quantity: limitOrder1.quantity,
                    symbol: "BTCUSD",
                    owner: "kayson",
                },

                bid: {
                    id: "1",
                    timestamp: 3,
                    type: "limit",
                    side: "BID",
                    status: "FILLED",
                    quantity: limitOrder1.quantity,
                    symbol: "BTCUSD",
                    owner: "kayson",
                    price: limitOrder1.price,
                }
            },
            {
                ask: {
                    id: "3",
                    timestamp: 3,
                    price: limitOrder2.price,
                    type: "market",
                    side: "ASK",
                    status: "FILLED",
                    quantity: marketOrder.quantity - limitOrder1.quantity,
                    symbol: "BTCUSD",
                    owner: "kayson",
                },

                bid: {
                    id: "2",
                    timestamp: 3,
                    type: "limit",
                    side: "BID",
                    status: "ACTIVE",
                    quantity: limitOrder2.quantity - marketOrder.quantity - limitOrder1.quantity,
                    symbol: "BTCUSD",
                    owner: "kayson",
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
            symbol: "BTCUSD",
            owner: "kayson",
            price: 2,
        };

        book.submitOrderRequest(askOrder)

        expect(book.getSpread()).toBeUndefined()

        const bidOrder: LimitOrderRequest = {
            type: "limit",
            side: "BID",
            quantity: 1,
            symbol: "BTCUSD",
            owner: "kayson",
            price: 1,
        };
        book.submitOrderRequest(bidOrder)

        expect(book.getSpread()).toStrictEqual(1)

        const removeAskOrder = () => asks.dequeue();

        removeAskOrder();

        expect(book.getSpread()).toBeUndefined()
    })

})