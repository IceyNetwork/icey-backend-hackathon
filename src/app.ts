import { connectDb } from "./plugins/db.plugin";
import Fastify from "fastify";
import { Db, MongoClient } from "mongodb";
import cors from "@fastify/cors";
import authRoutes from "./routes/auth";
import threadsRoutes from "./routes/threads";
import messagesRoutes from "./routes/messages";
import walletRoutes from "./routes/wallet";
import friendsRoutes from "./routes/friends";
import authGuard from "./plugins/auth-guard.plugin";

declare module "fastify" {
  interface FastifyInstance {
    db: Db;
    mongoClient: MongoClient;
    auth: any;
  }
}

const app = Fastify({
  logger: process.env.NODE_ENV !== "test",
  ignoreTrailingSlash: true,
});

app.register(cors, {
  origin: "http://localhost:5173",
  credentials: true,
});
app.register(connectDb, { forceClose: true });
app.register(authGuard);
app.register(authRoutes);
app.register(threadsRoutes);
app.register(messagesRoutes);
app.register(walletRoutes);
app.register(friendsRoutes);

export default app;
