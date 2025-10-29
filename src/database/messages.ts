import { Collections } from "../models/collections";
import { BaseCollection } from "./base";
import { MongoClient, ObjectId } from "mongodb";
import { MessageDoc, MessageKind } from "../models/types";

export class MessagesCollection extends BaseCollection<MessageDoc> {
  constructor(client: MongoClient) {
    super(Collections.Messages, client);
  }

  async add(
    threadId: string,
    sender: string,
    content: string,
    kind: MessageKind = "text"
  ) {
    const now = new Date();
    const doc: MessageDoc = {
      threadId: new ObjectId(threadId),
      sender,
      content,
      kind,
      createdAt: now,
    };
    const res = await this.collection.insertOne(doc as any);
    return { ...doc, _id: res.insertedId } as any;
  }

  list(threadId: string, limit = 50, cursor?: string) {
    const q: any = { threadId: new ObjectId(threadId) };
    if (cursor) q._id = { $lt: new ObjectId(cursor) };
    return this.collection.find(q).sort({ _id: -1 }).limit(limit).toArray();
  }
}
