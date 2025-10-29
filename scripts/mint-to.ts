import { BN, AnchorProvider } from "@coral-xyz/anchor";
import { payer } from "./payer";
import {
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const provider = AnchorProvider.local(
  "https://devnet.helius-rpc.com/?api-key=2fe47b6e-4ace-42ed-ac8c-334520be28ef",
  {
    skipPreflight: true,
  }
);
const connection = provider.connection;

const MINT = new PublicKey("2mgv5DmCpkkNkhfwR4zrKNwDz2KMYHnEMkBQr1EHCkj8");
const RECIPIENT = new PublicKey("FTZUbcmz5VDGBcTXQoD2EhawEHZd52aRiMd77LyJH4XW");
const DECIMALS = 6;
const AMOUNT = new BN(2500000).muln(10 ** DECIMALS);

const main = async () => {
  try {
    const programId = TOKEN_PROGRAM_ID;
    const mintAuthority = payer;

    const ata = getAssociatedTokenAddressSync(
      MINT,
      RECIPIENT,
      false,
      programId,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction();
    const info = await connection.getAccountInfo(ata);
    if (!info) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payer.publicKey,
          ata,
          RECIPIENT,
          MINT,
          programId,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }
    transaction.add(
      createMintToInstruction(
        MINT,
        ata,
        mintAuthority.publicKey,
        BigInt(AMOUNT.toString()),
        undefined,
        programId
      )
    );
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    transaction.feePayer = payer.publicKey;
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    await sendAndConfirmTransaction(connection, transaction, [payer]);
    console.log("Tokens Minted");
  } catch (error) {
    console.error("Error minting tokens:", error);
  }
};

main();
