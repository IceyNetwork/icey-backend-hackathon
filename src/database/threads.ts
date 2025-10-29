import { Collections } from "../models/collections";
import { BaseCollection } from "./base";
import { MongoClient } from "mongodb";
import { ThreadDoc } from "../models/types";
import { FriendsCollection } from "./friends";

export class ThreadsCollection extends BaseCollection<ThreadDoc> {
  constructor(client: MongoClient) {
    super(Collections.Threads, client);
  }

  private key(a: string, b: string): [string, string] {
    return [a, b].sort() as [string, string];
  }

  async getOrCreate(a: string, b: string) {
    const participants = this.key(a, b);
    const existing = await this.collection.findOne({ participants });
    if (existing) return existing;

    const friends = new FriendsCollection(this.client);
    const rel = await friends.get(a, b);
    if (!rel || rel.status !== "accepted") {
      throw new Error("Not friends");
    }

    const now = new Date();
    const doc: ThreadDoc = { participants, createdAt: now, updatedAt: now };

    const res = await this.collection.insertOne(doc);
    return { ...doc, _id: res.insertedId };
  }

  listForUser(address: string, limit = 50) {
    return this.collection
      .find({ participants: address })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
  }
}
