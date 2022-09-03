import { MatchingEngine } from "../src/engine";
import { LimitOrderRequest, MarketOrderRequest } from "../src/models/OrderRequest";
import { Order } from "../src/order";
import { Sequenced } from "../src/system";


describe("matching engine basic", () => {
    let id = 0;
    const idGenFn = () => String(++id);
    let matchingEngine = new MatchingEngine(idGenFn);
    
    let seq_no = 0;
    const nextSeq = () => ++seq_no


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

        const result = matchingEngine.createOrder(askLimitOrderRequest);

        if (result.status === "success") {
            const expectedOrder: Sequenced<Order> = {
                ...askLimitOrderRequest,
                price: 1,
                id: "1",
                status: "ACTIVE",
            }

            expect(result.data).toStrictEqual(expectedOrder);
        } else {
            fail("order should be successfully created")
        }
    });

    test("should create MARKET orders succesfully - no LIMIT orders in market", () => {
        const askMarketOrderRequest: Sequenced<MarketOrderRequest> = {
            seq_no: nextSeq(),
            type: "market",
            quantity: 1,
            side: "ASK",
        };

        const askResult = matchingEngine.createOrder(askMarketOrderRequest);

        if (askResult.status === "success") {
            const expectedOrder: Sequenced<Order> = {
                ...askMarketOrderRequest,
                price: -Infinity,
                id: "1",
                status: "ACTIVE",
            }

            expect(askResult.data).toStrictEqual(expectedOrder);
        } else {
            fail("order should be successfully created")
        }

        const bidMarketOrderRequest: Sequenced<MarketOrderRequest> = {
            seq_no: nextSeq(),
            type: "market",
            quantity: 1,
            side: "BID",
        };

        const bidResult = matchingEngine.createOrder(bidMarketOrderRequest);

        if (bidResult.status === "success") {
            const expectedOrder: Sequenced<Order> = {
                ...bidMarketOrderRequest,
                price: Infinity,
                id: "2",
                status: "ACTIVE",
            }

            expect(bidResult.data).toStrictEqual(expectedOrder);
        } else {
            fail("order should be successfully created")
        }

    })

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

        const result = matchingEngine.createOrder(askMarketOrderRequest);

        if (result.status === "success") {
            const expectedOrder: Sequenced<Order> = {
                ...askMarketOrderRequest,
                price: bidLimitOrderRequest.price,
                id: "2",
                status: "ACTIVE",
            }

            expect(result.data).toStrictEqual(expectedOrder);
        } else {
            fail("order should be successfully created")
        }

    })
});