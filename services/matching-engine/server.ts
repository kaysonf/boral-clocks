// ESM
import Fastify from "fastify";

// const bookKeeper = new Map<string, Book>();

const fastify = Fastify({
  logger: true,
});

fastify.get("/", async () => {
  return { hello: "world" };
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
