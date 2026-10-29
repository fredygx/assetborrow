import { Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import bs58 from "bs58";

const keypair = await Keypair.generate();
const transaction = new Transaction({
  feePayer: keypair.publicKey,
  blockhash: "11111111111111111111111111111111",
  lastValidBlockHeight: 1000n,
});
transaction.add(
  new TransactionInstruction({
    keys: [],
    programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
    data: new TextEncoder().encode('{"v":1,"app":"asset-borrow","evt":"TEST"}'),
  }),
);
try {
  const raw = await transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
  console.log("serialize OK", raw.constructor.name, raw.length);
  console.log("bs58 length", bs58.encode(raw).length);
  console.log("first bytes", [...raw.slice(0, 8)]);
} catch (e) {
  console.log("serialize ERR", e.message);
}
