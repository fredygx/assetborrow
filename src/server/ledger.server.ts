import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import type {
  AssetStatus,
  Ledger,
  LedgerAsset,
  LedgerEvent,
  LedgerMemo,
  LedgerRecord,
  LedgerRequest,
  LedgerTx,
  RequestStatus,
} from "@/lib/ledger";
import { MEMO_PROGRAM_ID } from "@/lib/solana-config";
import { DATA_DIR, LEDGER_PATH, SEED_LEDGER_PATH } from "./storage.server";

const ADMIN_WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosg9pQ";
const BORROWER_WALLET = "9aRbF3kPq2mZxW8yLtN5vC6hJ4dEuS1oGiY7nBQr2kLm";

function nowIso() {
  return new Date().toISOString();
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(object)
        .sort()
        .map((key) => [key, sortValue(object[key])]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown) {
  return JSON.stringify(sortValue(value));
}

export function sha256(value: string) {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function snapshotAsset(asset: LedgerAsset): LedgerAsset {
  return {
    id: asset.id,
    nama: asset.nama,
    kondisi: asset.kondisi,
    kategori: asset.kategori,
    status: asset.status,
  };
}

function snapshotRequest(request: LedgerRequest): LedgerRequest {
  const snapshot: LedgerRequest = {
    id: request.id,
    assetId: request.assetId,
    peminjam: request.peminjam,
    telepon: request.telepon,
    status: request.status,
    createdAt: request.createdAt,
  };
  if (request.wallet) snapshot.wallet = request.wallet;
  if (request.signedAt) snapshot.signedAt = request.signedAt;
  if (request.returnedAt) snapshot.returnedAt = request.returnedAt;
  return snapshot;
}

type RecordCore = Pick<
  LedgerRecord,
  | "id"
  | "seq"
  | "type"
  | "assetId"
  | "requestId"
  | "actorWallet"
  | "timestamp"
  | "prevHash"
  | "salt"
  | "assetStatusBefore"
  | "assetStatusAfter"
  | "requestStatusBefore"
  | "requestStatusAfter"
  | "offchain"
>;

type AppendInput = Omit<RecordCore, "id" | "seq" | "prevHash" | "salt">;

function appendRecord(ledger: Ledger, input: AppendInput): LedgerRecord {
  const seq = ledger.records.length + 1;
  const prevHash = ledger.records.at(-1)?.hash ?? null;
  const salt = randomBytes(16).toString("hex");
  const core: RecordCore = {
    id: `LOG-${String(seq).padStart(4, "0")}`,
    seq,
    ...input,
    prevHash,
    salt,
  };
  const hash = sha256(canonicalJson(core));
  const memo: LedgerMemo = {
    v: 1,
    app: "asset-borrow",
    evt: input.type,
    asset: input.assetId,
    req: input.requestId,
    hash,
    prev: prevHash,
    actor: input.actorWallet,
    ts: input.timestamp,
  };
  const record: LedgerRecord = { ...core, hash, memo, tx: null };
  ledger.records.push(record);
  ledger.lastHash = hash;
  ledger.updatedAt = input.timestamp;
  return record;
}

function ensureLedger(value: unknown): Ledger {
  if (!value || typeof value !== "object") throw new Error("File ledger tidak valid.");
  const ledger = value as Ledger;
  if (
    !Array.isArray(ledger.assets) ||
    !Array.isArray(ledger.requests) ||
    !Array.isArray(ledger.records)
  ) {
    throw new Error("Struktur ledger tidak lengkap.");
  }
  return ledger;
}

export async function readLedger(): Promise<Ledger> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await readFile(LEDGER_PATH, "utf8");
    return ensureLedger(JSON.parse(raw));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
    const seed = await readFile(SEED_LEDGER_PATH, "utf8");
    const ledger = ensureLedger(JSON.parse(seed));
    await writeLedger(ledger);
    return ledger;
  }
}

export async function writeLedger(ledger: Ledger) {
  await mkdir(DATA_DIR, { recursive: true });
  const payload = { ...ledger, $schema: "../docs/skema-ledger.json" };
  const temporaryPath = `${LEDGER_PATH}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await rename(temporaryPath, LEDGER_PATH);
}

export async function resetLedger() {
  const seed = await readFile(SEED_LEDGER_PATH, "utf8");
  const ledger = ensureLedger(JSON.parse(seed));
  await writeLedger(ledger);
  return ledger;
}

let writeQueue: Promise<unknown> = Promise.resolve();

function mutateLedger<T>(fn: (ledger: Ledger) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const ledger = await readLedger();
    const result = await fn(ledger);
    await writeLedger(ledger);
    return result;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

function nextAssetId(assets: LedgerAsset[]) {
  const max = assets.reduce((current, asset) => {
    const value = Number(asset.id.replace("AST-", ""));
    return Number.isFinite(value) ? Math.max(current, value) : current;
  }, 0);
  return `AST-${String(max + 1).padStart(3, "0")}`;
}

function nextRequestId(requests: LedgerRequest[]) {
  const max = requests.reduce((current, request) => {
    const value = Number(request.id.replace("REQ-", ""));
    return Number.isFinite(value) ? Math.max(current, value) : current;
  }, 99);
  return `REQ-${String(max + 1).padStart(3, "0")}`;
}

function walletOr(value: unknown, fallback: string) {
  return typeof value === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)
    ? value
    : fallback;
}

function text(value: unknown, field: string, max = 120) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} wajib diisi.`);
  const result = value.trim();
  if (result.length > max) throw new Error(`${field} terlalu panjang.`);
  return result;
}

function optionalText(value: unknown, max = 500) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error("Nilai teks tidak valid.");
  if (value.length > max) throw new Error("Teks terlalu panjang.");
  return value;
}

function photoUrl(value: unknown) {
  const url = optionalText(value, 500);
  if (!url) return undefined;
  if (!url.startsWith("/api/uploads/") && !/^https?:\/\//.test(url)) {
    throw new Error("Foto harus diunggah lewat /api/upload terlebih dahulu.");
  }
  return url;
}

function optionalHash(value: unknown) {
  const hash = optionalText(value, 80);
  if (!hash) return undefined;
  if (!/^sha256:[a-f0-9]{64}$/.test(hash)) throw new Error("Hash foto tidak valid.");
  return hash;
}

function assetId(value: unknown) {
  const id = text(value, "Aset", 12);
  if (!/^AST-[0-9]{3}$/.test(id)) throw new Error("ID aset tidak valid.");
  return id;
}

function requestId(value: unknown) {
  const id = text(value, "Permintaan", 12);
  if (!/^REQ-[0-9]{3}$/.test(id)) throw new Error("ID permintaan tidak valid.");
  return id;
}

function phone(value: unknown) {
  const telepon = text(value, "Telepon", 20);
  if (!/^[0-9+()\-\s]{8,20}$/.test(telepon)) throw new Error("Nomor telepon tidak valid.");
  return telepon;
}

export async function addAsset(input: {
  nama: string;
  kondisi: string;
  kategori: string;
  foto?: string;
  fotoHash?: string;
  actorWallet?: string;
}) {
  return mutateLedger((ledger) => {
    const timestamp = nowIso();
    const id = nextAssetId(ledger.assets);
    const status: AssetStatus = "Tersedia";
    const snapshot: LedgerAsset = {
      id,
      nama: input.nama,
      kondisi: input.kondisi,
      kategori: input.kategori,
      status,
    };
    const record = appendRecord(ledger, {
      type: "ASSET_REGISTER",
      assetId: id,
      requestId: null,
      actorWallet: walletOr(input.actorWallet, ADMIN_WALLET),
      timestamp,
      assetStatusBefore: null,
      assetStatusAfter: status,
      requestStatusBefore: null,
      requestStatusAfter: null,
      offchain: { asset: snapshot },
    });
    const asset: LedgerAsset = { ...snapshot, hash: record.hash };
    if (input.foto) asset.foto = input.foto;
    if (input.fotoHash) asset.fotoHash = input.fotoHash;
    ledger.assets.push(asset);
    return { ledger, hash: record.hash, assetId: id, recordId: record.id, memo: record.memo };
  });
}

export async function createRequest(input: {
  assetId: string;
  peminjam: string;
  telepon: string;
  actorWallet?: string;
}) {
  return mutateLedger((ledger) => {
    const asset = ledger.assets.find((item) => item.id === input.assetId);
    if (!asset) throw new Error("Aset tidak ditemukan.");
    if (asset.status === "Diarsipkan") throw new Error("Aset sudah diarsipkan.");
    if (asset.status === "Dipinjam") throw new Error("Aset sedang dipinjam.");

    const timestamp = nowIso();
    const id = nextRequestId(ledger.requests);
    const status: RequestStatus = "Menunggu";
    const snapshot: LedgerRequest = {
      id,
      assetId: asset.id,
      peminjam: input.peminjam,
      telepon: input.telepon,
      status,
      createdAt: timestamp,
    };
    const record = appendRecord(ledger, {
      type: "BORROW_REQUEST",
      assetId: asset.id,
      requestId: id,
      actorWallet: walletOr(input.actorWallet, ADMIN_WALLET),
      timestamp,
      assetStatusBefore: asset.status,
      assetStatusAfter: asset.status,
      requestStatusBefore: null,
      requestStatusAfter: status,
      offchain: { asset: snapshotAsset(asset), request: snapshot },
    });
    ledger.requests.push({ ...snapshot, hash: record.hash });
    return {
      ledger,
      hash: record.hash,
      requestId: id,
      recordId: record.id,
      memo: record.memo,
    };
  });
}

export async function signRequest(input: { id: string; wallet?: string }) {
  return mutateLedger((ledger) => {
    const request = ledger.requests.find((item) => item.id === input.id);
    if (!request) throw new Error("Permintaan tidak ditemukan.");
    if (request.status !== "Menunggu") throw new Error("Permintaan ini sudah ditandatangani.");
    const asset = ledger.assets.find((item) => item.id === request.assetId);
    if (!asset) throw new Error("Aset tidak ditemukan.");
    if (asset.status === "Diarsipkan") throw new Error("Aset sudah diarsipkan.");
    if (asset.status === "Dipinjam") throw new Error("Aset sedang dipinjam.");

    const timestamp = nowIso();
    const before = asset.status;
    const wallet = walletOr(input.wallet, request.wallet ?? BORROWER_WALLET);
    request.status = "Ditandatangani";
    request.wallet = wallet;
    request.signedAt = timestamp;
    asset.status = "Dipinjam";
    const record = appendRecord(ledger, {
      type: "AGREEMENT_SIGN",
      assetId: asset.id,
      requestId: request.id,
      actorWallet: wallet,
      timestamp,
      assetStatusBefore: before,
      assetStatusAfter: "Dipinjam",
      requestStatusBefore: "Menunggu",
      requestStatusAfter: "Ditandatangani",
      offchain: { asset: snapshotAsset(asset), request: snapshotRequest(request) },
    });
    request.hash = record.hash;
    asset.hash = record.hash;
    return { ledger, hash: record.hash, recordId: record.id, memo: record.memo };
  });
}

export async function returnAsset(input: { assetId: string; actorWallet?: string }) {
  return mutateLedger((ledger) => {
    const asset = ledger.assets.find((item) => item.id === input.assetId);
    if (!asset) throw new Error("Aset tidak ditemukan.");
    if (asset.status !== "Dipinjam") throw new Error("Aset ini tidak sedang dipinjam.");
    const request = [...ledger.requests]
      .reverse()
      .find((item) => item.assetId === asset.id && item.status === "Ditandatangani");
    if (!request) throw new Error("Tidak ada perjanjian aktif untuk aset ini.");

    const timestamp = nowIso();
    request.status = "Selesai";
    request.returnedAt = timestamp;
    asset.status = "Dikembalikan";
    const record = appendRecord(ledger, {
      type: "ASSET_RETURN",
      assetId: asset.id,
      requestId: request.id,
      actorWallet: walletOr(input.actorWallet, ADMIN_WALLET),
      timestamp,
      assetStatusBefore: "Dipinjam",
      assetStatusAfter: "Dikembalikan",
      requestStatusBefore: "Ditandatangani",
      requestStatusAfter: "Selesai",
      offchain: { asset: snapshotAsset(asset), request: snapshotRequest(request) },
    });
    request.hash = record.hash;
    asset.hash = record.hash;
    return { ledger, hash: record.hash, recordId: record.id, memo: record.memo };
  });
}

export async function archiveAsset(input: { assetId: string; actorWallet?: string }) {
  return mutateLedger((ledger) => {
    const asset = ledger.assets.find((item) => item.id === input.assetId);
    if (!asset) throw new Error("Aset tidak ditemukan.");
    if (asset.status === "Diarsipkan") throw new Error("Aset sudah diarsipkan.");
    if (asset.status === "Dipinjam") {
      throw new Error("Aset sedang dipinjam. Kembalikan dulu sebelum menghapus.");
    }

    const activeRequest = ledger.requests.find(
      (item) =>
        item.assetId === asset.id &&
        (item.status === "Menunggu" || item.status === "Ditandatangani"),
    );
    if (activeRequest) {
      throw new Error(
        "Masih ada permintaan aktif untuk aset ini. Selesaikan dulu sebelum menghapus.",
      );
    }

    const timestamp = nowIso();
    const before = asset.status;
    asset.status = "Diarsipkan";
    const record = appendRecord(ledger, {
      type: "ASSET_ARCHIVE",
      assetId: asset.id,
      requestId: null,
      actorWallet: walletOr(input.actorWallet, ADMIN_WALLET),
      timestamp,
      assetStatusBefore: before,
      assetStatusAfter: "Diarsipkan",
      requestStatusBefore: null,
      requestStatusAfter: null,
      offchain: { asset: snapshotAsset(asset) },
    });
    asset.hash = record.hash;
    return { ledger, hash: record.hash, assetId: asset.id, recordId: record.id, memo: record.memo };
  });
}

function normalizeTransaction(value: unknown): LedgerTx {
  if (!value || typeof value !== "object") throw new Error("Data transaksi tidak valid.");
  const tx = value as Record<string, unknown>;
  const signature = text(tx["signature"], "Signature", 100);
  if (!/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(signature)) {
    throw new Error("Signature transaksi tidak valid.");
  }
  const slot = Number(tx["slot"]);
  const blockTime = Number(tx["blockTime"]);
  if (!Number.isInteger(slot) || slot < 0) throw new Error("Slot transaksi tidak valid.");
  if (!Number.isInteger(blockTime) || blockTime < 0) {
    throw new Error("Block time transaksi tidak valid.");
  }
  const status = tx["status"];
  if (
    status !== "processed" &&
    status !== "confirmed" &&
    status !== "finalized" &&
    status !== "failed"
  ) {
    throw new Error("Status transaksi tidak valid.");
  }
  const explorerUrl = text(tx["explorerUrl"], "Explorer URL", 300);
  if (!explorerUrl.startsWith("https://explorer.solana.com/tx/")) {
    throw new Error("Explorer URL tidak valid.");
  }
  const error = optionalText(tx["error"], 500);
  return {
    signature,
    slot,
    blockTime,
    status,
    explorerUrl,
    ...(error ? { error } : {}),
  };
}

export async function attachTransaction(input: { recordId: string; tx: LedgerTx }) {
  return mutateLedger((ledger) => {
    const recordId = text(input.recordId, "Record", 20);
    const record = ledger.records.find((item) => item.id === recordId);
    if (!record) throw new Error("Record ledger tidak ditemukan.");
    if (record.tx && record.tx.signature !== input.tx.signature) {
      throw new Error("Record ini sudah memiliki transaksi on-chain lain.");
    }
    record.tx = input.tx;
    ledger.network = "devnet";
    ledger.program = { type: "memo", id: MEMO_PROGRAM_ID };
    ledger.updatedAt = nowIso();
    return { ledger, record };
  });
}

export function parseTransaction(value: unknown) {
  return normalizeTransaction(value);
}

export async function runLedgerAction(body: unknown) {
  if (!body || typeof body !== "object") throw new Error("Body aksi tidak valid.");
  const action = body as Record<string, unknown>;
  const type = action["type"];
  const rawPayload = action["payload"];
  const payload =
    rawPayload && typeof rawPayload === "object" ? (rawPayload as Record<string, unknown>) : {};

  switch (type) {
    case "ADD_ASSET": {
      const foto = photoUrl(payload["foto"]);
      const fotoHash = optionalHash(payload["fotoHash"]);
      return addAsset({
        nama: text(payload["nama"], "Nama aset"),
        kondisi: text(payload["kondisi"], "Kondisi", 80),
        kategori: text(payload["kategori"], "Kategori", 80),
        ...(foto ? { foto } : {}),
        ...(fotoHash ? { fotoHash } : {}),
        ...(typeof payload["actorWallet"] === "string"
          ? { actorWallet: payload["actorWallet"] }
          : {}),
      });
    }
    case "CREATE_REQUEST":
      return createRequest({
        assetId: assetId(payload["assetId"]),
        peminjam: text(payload["peminjam"], "Nama peminjam"),
        telepon: phone(payload["telepon"]),
        ...(typeof payload["actorWallet"] === "string"
          ? { actorWallet: payload["actorWallet"] }
          : {}),
      });
    case "SIGN_REQUEST":
      return signRequest({
        id: requestId(payload["id"]),
        ...(typeof payload["wallet"] === "string" ? { wallet: payload["wallet"] } : {}),
      });
    case "RETURN_ASSET":
      return returnAsset({
        assetId: assetId(payload["assetId"]),
        ...(typeof payload["actorWallet"] === "string"
          ? { actorWallet: payload["actorWallet"] }
          : {}),
      });
    case "ARCHIVE_ASSET":
      return archiveAsset({
        assetId: assetId(payload["assetId"]),
        ...(typeof payload["actorWallet"] === "string"
          ? { actorWallet: payload["actorWallet"] }
          : {}),
      });
    case "RESET":
      return { ledger: await resetLedger() };
    default:
      throw new Error("Aksi tidak dikenal.");
  }
}

export type LedgerActionType =
  "ADD_ASSET" | "CREATE_REQUEST" | "SIGN_REQUEST" | "RETURN_ASSET" | "ARCHIVE_ASSET" | "RESET";

export type LedgerAction = {
  type: LedgerActionType;
  payload?: Record<string, unknown>;
};

export type LedgerActionEvent = LedgerEvent;
