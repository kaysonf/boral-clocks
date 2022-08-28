// ESM
import Fastify from "fastify";
import { Book } from "./src/book/Book";

const book = new Book();

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
