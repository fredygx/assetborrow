import { Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import bs58 from "bs58";

const keypair = await Keypair.generate();
const config = {
  feePayer: keypair.publicKey,
  blockhash: "11111111111111111111111111111111",
  lastValidBlockHeight: 1000n,
};
const transaction = new Transaction(config);
transaction.add(
  new TransactionInstruction({
    keys: [],
    programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
    data: new TextEncoder().encode('{"v":1,"app":"asset-borrow","evt":"TEST"}'),
  }),
);
const message = transaction.serializeMessage();
console.log(bs58.encode(message));
