export type AssetStatus = "Tersedia" | "Dipinjam" | "Dikembalikan" | "Diarsipkan";
export type RequestStatus = "Menunggu" | "Ditandatangani" | "Selesai";
export type LedgerEvent =
  | "ASSET_REGISTER"
  | "BORROW_REQUEST"
  | "AGREEMENT_SIGN"
  | "ASSET_RETURN"
  | "ASSET_ARCHIVE"
  | "DISPUTE_OPEN"
  | "DISPUTE_RESOLVE";

export type LedgerAsset = {
  id: string;
  nama: string;
  kondisi: string;
  kategori: string;
  status: AssetStatus;
  hash?: string;
  foto?: string;
  fotoHash?: string;
};

export type LedgerRequest = {
  id: string;
  assetId: string;
  peminjam: string;
  telepon: string;
  status: RequestStatus;
  hash?: string;
  wallet?: string;
  createdAt: string;
  signedAt?: string;
  returnedAt?: string;
};

export type LedgerMemo = {
  v: 1;
  app: "asset-borrow";
  evt: LedgerEvent;
  asset: string;
  req: string | null;
  hash: string;
  prev: string | null;
  actor: string;
  ts: string;
};

export type LedgerTx = {
  signature: string;
  slot: number;
  blockTime: number;
  status: "processed" | "confirmed" | "finalized" | "failed";
  explorerUrl: string;
  error?: string;
};

export type LedgerOffchain = {
  asset?: LedgerAsset;
  request?: LedgerRequest;
  catatan?: string;
};

export type LedgerRecord = {
  id: string;
  seq: number;
  type: LedgerEvent;
  assetId: string;
  requestId: string | null;
  actorWallet: string;
  timestamp: string;
  prevHash: string | null;
  salt: string;
  hash: string;
  assetStatusBefore: AssetStatus | null;
  assetStatusAfter: AssetStatus | null;
  requestStatusBefore: RequestStatus | null;
  requestStatusAfter: RequestStatus | null;
  offchain: LedgerOffchain;
  memo: LedgerMemo;
  tx: LedgerTx | null;
};

export type Ledger = {
  $schema?: string;
  schemaVersion: "1.0.0";
  app: "asset-borrow";
  network: "simulasi" | "localnet" | "devnet" | "testnet" | "mainnet-beta";
  program: { type: "simulasi" | "memo" | "anchor"; id: string };
  hashAlgorithm: "sha256";
  canonicalization: "json-sort-keys-v1";
  createdAt: string;
  updatedAt: string;
  lastHash: string | null;
  assets: LedgerAsset[];
  requests: LedgerRequest[];
  records: LedgerRecord[];
};

export const EVENT_LABEL: Record<LedgerEvent, string> = {
  ASSET_REGISTER: "Registrasi aset",
  BORROW_REQUEST: "Permintaan peminjaman dibuat",
  AGREEMENT_SIGN: "Tanda tangan perjanjian",
  ASSET_RETURN: "Pengembalian aset",
  ASSET_ARCHIVE: "Aset diarsipkan",
  DISPUTE_OPEN: "Sengketa dibuka",
  DISPUTE_RESOLVE: "Sengketa diselesaikan",
};

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: string) {
  const date = parseDate(value);
  return date
    ? date.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : "—";
}

export function formatDateTime(value?: string) {
  const date = parseDate(value);
  return date ? date.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "—";
}

export function shortHash(hash?: string) {
  if (!hash) return "—";
  const prefix = hash.startsWith("sha256:") ? "sha256:" : "";
  const value = prefix ? hash.slice(prefix.length) : hash;
  return `${prefix}${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function shortWallet(wallet?: string) {
  return wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-3)}` : "—";
}
