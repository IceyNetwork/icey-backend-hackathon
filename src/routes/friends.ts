import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { FriendsCollection } from "../database/friends";

const friendsRoutes: FastifyPluginAsync = async (app) => {
  const friends = new FriendsCollection(app.mongoClient);

  app.get("/friends", { preHandler: [app.auth] }, async (req: any) => {
    const me = req.user.sub as string;
    return friends.listAccepted(me);
  });

  app.get("/friends/pending", { preHandler: [app.auth] }, async (req: any) => {
    const me = req.user.sub as string;
    return friends.listPending(me);
  });

  app.post<{ Body: { peer: string; name?: string } }>(
    "/friends/request",
    { preHandler: [app.auth] },
    async (req: any, reply) => {
      const me = req.user.sub as string;
      const peer = req.body.peer?.trim();
      const name = req.body.name?.trim();
      if (!peer) return reply.code(400).send({ error: "Peer required" });
      try {
        const doc = await friends.request(me, peer, name);
        return doc;
      } catch (e: any) {
        return reply.code(400).send({ error: e.message });
      }
    }
  );

  app.post<{ Body: { peer: string } }>(
    "/friends/accept",
    { preHandler: [app.auth] },
    async (req: any, reply) => {
      const me = req.user.sub as string;
      const peer = req.body.peer?.trim();
      if (!peer) return reply.code(400).send({ error: "Peer required" });
      try {
        return await friends.accept(me, peer);
      } catch (e: any) {
        return reply.code(400).send({ error: e.message });
      }
    }
  );

  app.patch<{ Body: { peer: string; name: string } }>(
    "/friends/name",
    { preHandler: [app.auth] },
    async (req: any, reply) => {
      const me = req.user.sub as string;
      const { peer, name } = req.body || {};
      if (!peer || !name)
        return reply.code(400).send({ error: "Peer and name required" });
      await friends.setName(me, peer, name.trim());
      return { ok: true };
    }
  );

  app.delete<{ Params: { peer: string } }>(
    "/friends/:peer",
    { preHandler: [app.auth] },
    async (req: any) => {
      const me = req.user.sub as string;
      const peer = req.params.peer?.trim();
      await friends.remove(me, peer);
      return { ok: true };
    }
  );
};
export default fp(friendsRoutes);
