import { Collections } from "../models/collections";
import { BaseCollection } from "./base";
import { MongoClient } from "mongodb";
import { FriendDoc } from "../models/types";

export class FriendsCollection extends BaseCollection<FriendDoc> {
  constructor(client: MongoClient) {
    super(Collections.Friends, client);
  }

  private key(a: string, b: string): [string, string] {
    return [a, b].sort() as [string, string];
  }

  async get(a: string, b: string) {
    const participants = this.key(a, b);
    return this.collection.findOne({ participants });
  }

  async listAccepted(me: string) {
    return this.collection
      .find({ status: "accepted", participants: { $in: [me] } })
      .sort({ updatedAt: -1 })
      .toArray();
  }

  async listPending(me: string) {
    return this.collection
      .find({ status: "pending", participants: { $in: [me] } })
      .sort({ updatedAt: -1 })
      .toArray();
  }

  async request(me: string, peer: string, name: string) {
    if (me === peer) throw new Error("Cannot friend self");
    const participants = this.key(me, peer);
    const existing = await this.collection.findOne({ participants });
    if (existing) {
      if (existing.status === "accepted") return existing;
      if (existing.status === "pending" && existing.requestedBy !== me) {
        return this.accept(me, peer);
      }

      await this.collection.updateOne(
        { _id: existing._id },
        { $set: { ["names." + me]: name, updatedAt: new Date() } }
      );

      return {
        ...existing,
        names: {
          ...(existing.names || {}),
          [me]: name || (existing.names || {})[me],
        },
      } as any;
    }

    const now = new Date();
    const doc: FriendDoc = {
      participants,
      status: "pending",
      requestedBy: me,
      names: { [me]: name },
      createdAt: now,
      updatedAt: now,
    };
    const res = await this.collection.insertOne(doc);
    return { ...doc, _id: res.insertedId };
  }

  async accept(me: string, peer: string) {
    const participants = this.key(me, peer);
    const now = new Date();
    const res = await this.collection.findOneAndUpdate(
      { participants, status: "pending", requestedBy: peer },
      { $set: { status: "accepted", acceptedAt: now, updatedAt: now } },
      { returnDocument: "after" }
    );
    if (!res) throw new Error("No pending invite from peer");
    return res;
  }

  async setName(me: string, peer: string, name: string) {
    const participants = this.key(me, peer);
    await this.collection.updateOne(
      { participants },
      {
        $set: { ["names." + me]: name, updatedAt: new Date() },
      }
    );
    return true;
  }

  async remove(a: string, b: string) {
    const participants = this.key(a, b);
    await this.collection.deleteOne({ participants });
    return true;
  }
}
