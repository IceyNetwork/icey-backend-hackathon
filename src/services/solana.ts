import bs58 from "bs58";
import nacl from "tweetnacl";
import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import { SOLANA } from "../config";
import { Keypair } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export function verifySolanaSignature(
  address: string,
  message: string,
  signatureBase58: string
) {
  const publicKeyBytes = bs58.decode(address);
  const sigBytes = bs58.decode(signatureBase58);
  const messageBytes = Buffer.from(message, "utf8");
  return nacl.sign.detached.verify(messageBytes, sigBytes, publicKeyBytes);
}

export const connection = new Connection(SOLANA.RPC_URL, "confirmed");
export const treasury = new PublicKey(SOLANA.TREASURY);
export const payer = Keypair.fromSecretKey(bs58.decode(SOLANA.PRIVATE_KEY));
export const mint = new PublicKey(SOLANA.MINT);
export const decimals = SOLANA.MINT_DECIMALS;

export async function submitSignedTxBase64(txBase64: string): Promise<string> {
  const sig = await connection.sendRawTransaction(
    Buffer.from(txBase64, "base64"),
    { skipPreflight: true }
  );

  return sig;
}

export async function withdrawSplToUser(
  userAddress: string,
  units: BN
): Promise<string> {
  if (units.lte(new BN(0))) throw new Error("Amount must be positive");
  const userPk = new PublicKey(userAddress);
  const userAta = getAssociatedTokenAddressSync(
    mint,
    userPk,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const tx = new Transaction();

  const info = await connection.getAccountInfo(userAta);

  if (!info) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        userAta,
        userPk,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  tx.add(
    createTransferCheckedInstruction(
      treasury,
      mint,
      userAta,
      payer.publicKey,
      Number(units.toString()),
      decimals
    )
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;

  return await sendAndConfirmTransaction(connection, tx, [payer]);
}
