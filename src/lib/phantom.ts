import type { Transaction } from "@solana/web3.js";

export type PhantomPublicKey = { toString: () => string };

export type PhantomProvider = {
  isPhantom?: boolean;
  isConnected?: boolean;
  publicKey?: PhantomPublicKey | null;
  connect: () => Promise<{ publicKey: PhantomPublicKey }>;
  disconnect: () => Promise<void>;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
  signAndSendTransaction?: (transaction: Transaction) => Promise<{ signature: string }>;
  request?: (args: { method: string; params?: unknown }) => Promise<unknown>;
  on: (
    event: "connect" | "disconnect" | "accountChanged",
    listener: (publicKey?: PhantomPublicKey | null) => void,
  ) => void;
  off?: (
    event: "connect" | "disconnect" | "accountChanged",
    listener: (publicKey?: PhantomPublicKey | null) => void,
  ) => void;
};

declare global {
  interface Window {
    phantom?: { solana?: PhantomProvider };
    solana?: PhantomProvider;
  }
}

export function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  return window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : null);
}
