import { Collections } from "../models/collections";
import { DATABASE_NAME, DATABASE_URL } from "../config/index";
import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { MongoClient } from "mongodb";

export const connectDb = fastifyPlugin(async (app: FastifyInstance) => {
  const client = new MongoClient(DATABASE_URL);
  await client.connect();
  const db = client.db(DATABASE_NAME);

  await Promise.all([
    db
      .collection(Collections.Users)
      .createIndex({ address: 1 }, { unique: true }),
    db
      .collection(Collections.Threads)
      .createIndex({ participants: 1 }, { unique: true }),
    db
      .collection(Collections.Messages)
      .createIndex({ threadId: 1, createdAt: -1 }),
    db
      .collection(Collections.Friends)
      .createIndex({ status: 1, participants: 1 }),
  ]);

  app.decorate("db", db);
  app.decorate("mongoClient", client);
});
