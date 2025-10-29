import { AnchorProvider } from "@coral-xyz/anchor";
import { payer } from "./payer";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import {
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const provider = AnchorProvider.local(
  "https://devnet.helius-rpc.com/?api-key=2fe47b6e-4ace-42ed-ac8c-334520be28ef",
  {
    skipPreflight: true,
  }
);
const connection = provider.connection;
const DECIMALS = 6;

const main = async () => {
  try {
    const programId = TOKEN_PROGRAM_ID;
    const mintAuthority = payer.publicKey;
    const freezeAuthority = payer.publicKey;

    const transaction = new Transaction();
    const mint = Keypair.generate();

    const lamports = await getMinimumBalanceForRentExemptMint(connection);

    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports,
        programId,
      })
    );

    transaction.add(
      createInitializeMintInstruction(
        mint.publicKey,
        DECIMALS,
        mintAuthority,
        freezeAuthority,
        programId
      )
    );

    const ata = getAssociatedTokenAddressSync(
      mint.publicKey,
      payer.publicKey,
      false,
      programId,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        ata,
        payer.publicKey,
        mint.publicKey,
        programId,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    transaction.feePayer = payer.publicKey;
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    await sendAndConfirmTransaction(connection, transaction, [payer, mint]);
    console.log(
      `Mint created: ${mint.publicKey.toString()}, Treasury: ${ata.toString()}`
    );
  } catch (error) {
    console.error("Error creating mint", error);
  }
};

main();
