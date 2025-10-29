import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

export const payer = Keypair.fromSecretKey(
  bs58.decode(
    "5iAeYgRpFGeXeJL4hzoucuRFiTkdr2KaZZTJdv5goYoW75wbLbLZEETxR5iUU1sJzoExzTEfe6QHmAD4An6gaH7d"
  )
);
