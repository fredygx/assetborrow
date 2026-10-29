import {
  Connection,
  PublicKey,
  SendTransactionError,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";
import type { LedgerMemo, LedgerTx } from "@/lib/ledger";
import { getPhantomProvider, type PhantomProvider } from "@/lib/phantom";
import { explorerTxUrl, MEMO_PROGRAM_ID, SOLANA_RPC_ENDPOINT } from "@/lib/solana-config";

const memoProgram = new PublicKey(MEMO_PROGRAM_ID);
const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");

function isUserRejection(cause: unknown) {
  if (!cause || typeof cause !== "object") return false;
  const code = (cause as { code?: unknown }).code;
  if (code === 4001) return true;
  const message = cause instanceof Error ? cause.message.toLowerCase() : "";
  return message.includes("user rejected") || message.includes("rejected the request");
}

function extractSignature(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return null;
  const signature = (value as { signature?: unknown }).signature;
  return typeof signature === "string" ? signature : null;
}

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : String(cause);
}

async function serializeSignedTransaction(value: unknown): Promise<Uint8Array> {
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string") {
    try {
      return bs58.decode(value);
    } catch {
      throw new Error("Transaksi tertandatangani bukan base58 yang valid.");
    }
  }
  if (value && typeof value === "object" && "serialize" in value) {
    const serialize = (value as { serialize: () => Uint8Array | Promise<Uint8Array> }).serialize;
    return await serialize.call(value);
  }
  throw new Error("Phantom tidak mengembalikan transaksi tertandatangani.");
}

async function sendWithPhantom(
  provider: PhantomProvider,
  transaction: Transaction,
): Promise<string> {
  const errors: string[] = [];
  const serialized = await transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  const encoded = bs58.encode(serialized);

  if (provider.request) {
    let signed = false;
    try {
      const result = await provider.request({
        method: "signTransaction",
        params: { message: encoded },
      });
      const raw = await serializeSignedTransaction(result);
      signed = true;
      return await connection.sendRawTransaction(raw, {
        skipPreflight: false,
        maxRetries: 3n,
      });
    } catch (cause) {
      if (isUserRejection(cause)) throw cause;
      if (signed) throw cause;
      errors.push(`request.signTransaction: ${errorMessage(cause)}`);
    }

    try {
      const result = await provider.request({
        method: "signAndSendTransaction",
        params: { message: encoded },
      });
      const signature = extractSignature(result);
      if (signature) return signature;
      errors.push("request.signAndSendTransaction: Phantom tidak mengembalikan signature");
    } catch (cause) {
      if (isUserRejection(cause)) throw cause;
      errors.push(`request.signAndSendTransaction: ${errorMessage(cause)}`);
    }
  }

  if (provider.signTransaction) {
    let signed = false;
    try {
      const result = await provider.signTransaction(transaction);
      const raw = await result.serialize();
      signed = true;
      return await connection.sendRawTransaction(raw, {
        skipPreflight: false,
        maxRetries: 3n,
      });
    } catch (cause) {
      if (isUserRejection(cause)) throw cause;
      if (signed) throw cause;
      errors.push(`signTransaction: ${errorMessage(cause)}`);
    }
  }

  if (provider.signAndSendTransaction) {
    try {
      const result = await provider.signAndSendTransaction(transaction);
      if (result.signature) return result.signature;
      errors.push("signAndSendTransaction: Phantom tidak mengembalikan signature");
    } catch (cause) {
      if (isUserRejection(cause)) throw cause;
      errors.push(`signAndSendTransaction: ${errorMessage(cause)}`);
    }
  }

  throw new Error(errors.join(" | ") || "Wallet ini tidak mendukung pengiriman transaksi.");
}

export async function sendMemoTransaction(
  memo: LedgerMemo,
  walletAddress: string,
): Promise<LedgerTx> {
  const provider = getPhantomProvider();
  if (!provider) {
    throw new Error("Phantom tidak ditemukan. Pasang ekstensi Phantom lalu coba lagi.");
  }

  let payer: PublicKey;
  try {
    payer = new PublicKey(walletAddress);
  } catch {
    throw new Error("Alamat wallet tidak valid.");
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: payer,
    blockhash,
    lastValidBlockHeight,
  });
  transaction.add(
    new TransactionInstruction({
      keys: [],
      programId: memoProgram,
      data: new TextEncoder().encode(JSON.stringify(memo)),
    }),
  );

  let signature: string;
  try {
    signature = await sendWithPhantom(provider, transaction);
  } catch (cause) {
    if (isUserRejection(cause)) {
      throw new Error("Transaksi dibatalkan di Phantom.");
    }
    if (cause instanceof SendTransactionError) {
      let logs = "";
      try {
        const detail = await cause.getLogs(connection);
        if (detail?.length) logs = ` Log: ${detail.join(" | ")}`;
      } catch {
        // Log RPC opsional; error utama tetap ditampilkan.
      }
      throw new Error(`Gagal mengirim transaksi Devnet. ${cause.message}${logs}`);
    }
    throw cause instanceof Error
      ? new Error(
          `Gagal mengirim transaksi Devnet: ${cause.message}. Pastikan Phantom di jaringan Devnet dan punya SOL Devnet.`,
        )
      : new Error(
          "Gagal mengirim transaksi Devnet. Pastikan Phantom di jaringan Devnet dan punya SOL Devnet.",
        );
  }

  let confirmation;
  try {
    confirmation = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );
  } catch (cause) {
    throw cause instanceof Error
      ? new Error(`Transaksi terkirim tetapi konfirmasi gagal: ${cause.message}`)
      : new Error("Transaksi terkirim tetapi konfirmasi gagal.");
  }

  if (confirmation.value.err) {
    throw new Error(`Transaksi ditolak Devnet: ${JSON.stringify(confirmation.value.err)}`);
  }

  let slot = Number(confirmation.context.slot);
  let blockTime = Math.floor(Date.now() / 1000);
  try {
    const info = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (info) {
      slot = Number(info.slot);
      blockTime = info.blockTime ? Number(info.blockTime) : blockTime;
    }
  } catch {
    // Slot dari konfirmasi tetap dipakai kalau RPC detail sedang lambat.
  }

  return {
    signature,
    slot,
    blockTime,
    status: "confirmed",
    explorerUrl: explorerTxUrl(signature),
  };
}
