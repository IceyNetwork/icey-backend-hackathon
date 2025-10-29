import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { ThreadsCollection } from "../database/threads";

const threadsRoutes: FastifyPluginAsync = async (app) => {
  const threads = new ThreadsCollection(app.mongoClient);

  app.get("/threads", { preHandler: [app.auth] }, async (req: any) => {
    const me = req.user.sub as string;
    return threads.listForUser(me);
  });

  app.post<{ Body: { peer: string } }>(
    "/threads",
    { preHandler: [app.auth] },
    async (req: any, reply) => {
      const me = req.user.sub as string;
      const peer = req.body.peer?.trim();
      if (!peer) return reply.code(400).send({ error: "Peer required" });
      if (peer === me)
        return reply
          .code(400)
          .send({ error: "Cannot create thread with self" });
      try {
        const thread = await threads.getOrCreate(me, peer);
        return thread;
      } catch (e: any) {
        if (e.message === "not friends")
          return reply.code(403).send({ error: e.message });
        throw e;
      }
    }
  );
};

export default fp(threadsRoutes);
