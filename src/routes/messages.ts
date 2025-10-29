import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { MessagesCollection } from "../database/messages";
import { ThreadsCollection } from "../database/threads";
import { ObjectId } from "mongodb";

const messagesRoutes: FastifyPluginAsync = async (app) => {
  const messages = new MessagesCollection(app.mongoClient);
  const threads = new ThreadsCollection(app.mongoClient);

  app.get<{
    Params: { threadId: string };
    Querystring: { cursor?: string; limit?: number };
  }>(
    "/messages/:threadId",
    { preHandler: [app.auth] },
    async (req: any, reply) => {
      const me = req.user.sub as string;
      const { threadId } = req.params;
      const tid = new ObjectId(threadId as string);
      const thread = await threads.collection.findOne({
        _id: tid,
      });
      if (!thread || !thread.participants.includes(me))
        return reply.code(404).send({ error: "Not found" });
      const list = await messages.list(
        threadId,
        Number(req.query.limit) || 50,
        req.query.cursor
      );
      return list;
    }
  );

  app.post<{
    Body: { threadId: string; content: string; kind?: "text" | "activity" };
  }>("/messages", { preHandler: [app.auth] }, async (req: any, reply) => {
    const me = req.user.sub as string;
    const { threadId, content, kind } = req.body;
    if (!threadId || !content)
      return reply.code(400).send({ error: "ThreadId and content required" });
    const tid = new ObjectId(threadId as string);

    const thread = await threads.collection.findOne({ _id: tid });

    if (!thread || !thread.participants.includes(me))
      return reply.code(403).send({ error: "Forbidden" });
    const msg = await messages.add(
      threadId,
      me,
      content,
      (kind as any) || "text"
    );
    await threads.collection.updateOne(
      { _id: thread._id },
      { $set: { updatedAt: new Date() } }
    );
    return msg;
  });
};

export default fp(messagesRoutes);
