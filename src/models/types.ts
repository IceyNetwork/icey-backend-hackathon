import { ObjectId } from "mongodb";

export interface UserDoc {
  _id?: ObjectId;
  address: string;
  nonce: string;
  amount?: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface ThreadDoc {
  _id?: ObjectId;
  participants: [string, string];
  createdAt: Date;
  updatedAt: Date;
}

export type MessageKind = "text" | "activity";

export interface MessageDoc {
  _id?: ObjectId;
  threadId: ObjectId;
  sender: string;
  kind: MessageKind;
  content: string;
  createdAt: Date;
}

export type FriendStatus = "pending" | "accepted" | "blocked";

export interface FriendDoc {
  _id?: ObjectId;
  participants: [string, string];
  status: FriendStatus;
  requestedBy: string;
  names?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
}
