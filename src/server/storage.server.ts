import path from "node:path";

/**
 * Penyimpanan lokal untuk demo ke dosen.
 * Ubah LEDGER_DATA_DIR kalau ingin memakai folder lain.
 */
export const DATA_DIR = process.env["LEDGER_DATA_DIR"]
  ? path.resolve(process.env["LEDGER_DATA_DIR"])
  : path.join(process.cwd(), "data");

export const LEDGER_PATH = path.join(DATA_DIR, "ledger.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
export const SEED_LEDGER_PATH = path.join(process.cwd(), "src", "data", "ledger.json");
