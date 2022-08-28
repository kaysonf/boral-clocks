// ESM
import Fastify from "fastify";
import { askComparator, bidComparator, Book } from "./src/book/Book";
import { Order } from "./src/models/Order";
import { PriorityQueue } from "./src/utils";

const book = new Book({
  symbol: "BTCUSD",
  bids: new PriorityQueue<Order>(bidComparator),
  asks: new PriorityQueue<Order>(askComparator),
  systemConfig: {
    getCurrentTimestamp: () => Date.now(),
    getOrderId: () => "placeholder",
  },
});

// const bookKeeper = new Map<string, Book>();

const fastify = Fastify({
  logger: true,
});

fastify.get("/", async () => {
  return { hello: book.getSpread() };
});

/**
 * Run the server!
 */
const start = async (): Promise<void> => {
  await fastify.listen({ port: 3000 });
};

start().catch((err) => {
  fastify.log.error(err);

  process.exit(1);
});
