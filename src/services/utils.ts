import { randomBytes } from "crypto";
import { MAX_RETRIES, RETRY_DELAY } from "./consts";

export const retryOperation = async <T>(
  fn: () => Promise<T>,
  tries = 0
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (tries < MAX_RETRIES) {
      await delay(RETRY_DELAY);
      return retryOperation(fn, tries + 1);
    }
    throw error;
  }
};

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const makeNonce = (len = 24) => randomBytes(len).toString("hex");

export const loginMessage = (address: string, nonce: string) =>
  `Icey Login\nAddress: ${address}\nNonce: ${nonce}`;

export const clog = (msg: string) => {
  console.log(`[${new Date().toISOString()}] ${msg}`);
};
