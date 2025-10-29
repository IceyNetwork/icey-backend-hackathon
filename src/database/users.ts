import { Collections } from "../models/collections";
import { BaseCollection } from "./base";
import { MongoClient } from "mongodb";
import { UserDoc } from "../models/types";

export class UsersCollection extends BaseCollection<UserDoc> {
  constructor(client: MongoClient) {
    super(Collections.Users, client);
  }

  async upsertWithNonce(address: string, nonce: string) {
    const now = new Date();
    await this.collection.updateOne(
      { address },
      {
        $setOnInsert: { createdAt: now, amount: 0 },
        $set: { nonce, updatedAt: now },
      },
      { upsert: true }
    );
  }

  async findByAddress(address: string) {
    return this.collection.findOne({ address });
  }

  async rotateNonce(address: string, nextNonce: string) {
    const now = new Date();
    await this.collection.updateOne(
      { address },
      { $set: { nonce: nextNonce, updatedAt: now, lastLoginAt: now } }
    );
  }

  async incBalance(address: string, units: number) {
    const now = new Date();
    const res = await this.collection.updateOne(
      { address },
      [{ $set: { amount: { $add: ["$amount", units] }, updatedAt: now } }],
      { upsert: false }
    );
    return res.modifiedCount === 1;
  }

  async transfer(a: string, b: string, units: number) {
    if (units <= 0) throw new Error("Amount must be positive");
    return this.withSession(async (session) => {
      const users = this.collection;
      const ua = await users.findOne({ address: a }, { session });
      const ub = await users.findOne({ address: b }, { session });
      if (!ua || !ub) throw new Error("User not found");

      if ((ua.amount ?? 0) < units) throw new Error("Insufficient funds");

      await users.updateOne(
        { address: a },
        { $inc: { amount: -units }, $set: { updatedAt: new Date() } },
        { session }
      );
      await users.updateOne(
        { address: b },
        { $inc: { amount: units }, $set: { updatedAt: new Date() } },
        { session }
      );
      return true;
    });
  }
}
