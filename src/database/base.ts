import {
  Collection as MongoCollection,
  Document,
  ClientSession,
  MongoClient,
} from "mongodb";
import app from "../app";
import { retryOperation } from "../services/utils";

export abstract class BaseCollection<T extends Document> {
  collection: MongoCollection<T>;
  client: MongoClient;

  constructor(collectionName: string, client: MongoClient) {
    this.collection = app.db.collection<T>(collectionName);
    this.client = client;
  }

  async withSession<R>(fn: (session: ClientSession) => Promise<R>): Promise<R> {
    const session = this.client.startSession();
    try {
      const result = await retryOperation(() => fn(session));
      return result;
    } finally {
      await session.endSession();
    }
  }
}
