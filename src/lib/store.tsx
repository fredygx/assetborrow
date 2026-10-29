import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  EVENT_LABEL,
  formatDate,
  formatDateTime,
  shortHash,
  shortWallet,
  type AssetStatus,
  type Ledger,
  type LedgerAsset,
  type LedgerMemo,
  type LedgerRecord,
  type LedgerRequest,
  type LedgerTx,
} from "@/lib/ledger";
import { getPhantomProvider, type PhantomPublicKey } from "@/lib/phantom";
import { sendMemoTransaction } from "@/lib/solana";

export { shortHash, shortWallet };
export type { AssetStatus };

export type Asset = LedgerAsset;
export type Request = LedgerRequest & { tanggal: string; waktu?: string };
export type Log = {
  id: string;
  waktu: string;
  wallet: string;
  hash: string;
  aksi: string;
  assetId: string;
  status: string;
  tx: LedgerRecord["tx"];
};

export class AnchorError extends Error {
  readonly recordId: string;
  readonly hash: string | undefined;

  constructor(message: string, options: { recordId: string; hash: string | undefined }) {
    super(message);
    this.name = "AnchorError";
    this.recordId = options.recordId;
    this.hash = options.hash;
  }
}

export type SignResult = {
  hash: string;
  anchored: boolean;
  anchorError?: string;
};

const ADMIN_WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosg9pQ";
const BORROWER_WALLET = "9aRbF3kPq2mZxW8yLtN5vC6hJ4dEuS1oGiY7nBQr2kLm";

const fallbackAssets: Asset[] = [
  {
    id: "AST-001",
    nama: "Proyektor Epson EB-X500",
    kondisi: "Baik",
    kategori: "Audio Visual",
    status: "Dipinjam",
  },
  {
    id: "AST-002",
    nama: "Laptop ThinkPad T480",
    kondisi: "Baik",
    kategori: "Komputer",
    status: "Tersedia",
  },
  {
    id: "AST-003",
    nama: "Kamera Canon EOS R",
    kondisi: "Lecet ringan",
    kategori: "Dokumentasi",
    status: "Dikembalikan",
  },
  {
    id: "AST-004",
    nama: "Speaker Portabel JBL",
    kondisi: "Baik",
    kategori: "Audio Visual",
    status: "Tersedia",
  },
];

const fallbackRequests: Request[] = [
  {
    id: "REQ-101",
    assetId: "AST-001",
    peminjam: "Budi Mahasiswa",
    telepon: "0812-0000-1111",
    tanggal: "06/10/26",
    status: "Ditandatangani",
    wallet: BORROWER_WALLET,
    createdAt: "2026-10-06T09:00:00+07:00",
    signedAt: "2026-10-06T09:12:00+07:00",
    waktu: "06/10/26 09.12",
  },
  {
    id: "REQ-102",
    assetId: "AST-002",
    peminjam: "Budi Mahasiswa",
    telepon: "0812-0000-1111",
    tanggal: "08/10/26",
    status: "Menunggu",
    createdAt: "2026-10-08T08:00:00+07:00",
  },
];

function displayPeminjam(value: string) {
  return value
    .replace(/\s*\(dummy\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toDisplayRequest(request: LedgerRequest): Request {
  return {
    ...request,
    peminjam: displayPeminjam(request.peminjam),
    tanggal: formatDate(request.createdAt),
    ...(request.signedAt ? { waktu: formatDateTime(request.signedAt) } : {}),
  };
}

function toLog(record: LedgerRecord): Log {
  return {
    id: record.id,
    waktu: formatDateTime(record.timestamp),
    wallet: record.actorWallet,
    hash: record.hash,
    aksi: EVENT_LABEL[record.type],
    assetId: record.assetId,
    status: record.assetStatusAfter ?? "—",
    tx: record.tx,
  };
}

type Store = {
  wallet: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  assets: Asset[];
  requests: Request[];
  logs: Log[];
  ledger: Ledger | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
  addAsset: (a: {
    nama: string;
    kondisi: string;
    kategori: string;
    foto?: string;
  }) => Promise<void>;
  createRequest: (assetId: string, peminjam: string, telepon: string) => Promise<void>;
  signRequest: (id: string) => Promise<SignResult>;
  returnAsset: (assetId: string) => Promise<void>;
  archiveAsset: (assetId: string) => Promise<void>;
  anchorRecord: (recordId: string) => Promise<LedgerTx>;
};

const Ctx = createContext<Store | null>(null);

async function responseError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `Permintaan gagal (${response.status}).`;
  } catch {
    return `Permintaan gagal (${response.status}).`;
  }
}

async function uploadPhoto(dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const form = new FormData();
  form.append("file", blob, `asset.${extension}`);
  const response = await fetch("/api/upload", { method: "POST", body: form });
  if (!response.ok) throw new Error(await responseError(response));
  const payload = (await response.json()) as { url?: string; sha256?: string };
  if (!payload.url) throw new Error("Server tidak mengembalikan URL foto.");
  return { url: payload.url, sha256: payload.sha256 };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>(fallbackAssets);
  const [requests, setRequests] = useState<Request[]>(fallbackRequests);
  const [logs, setLogs] = useState<Log[]>([]);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyLedger = useCallback((next: Ledger) => {
    setLedger(next);
    setAssets(next.assets);
    setRequests(next.requests.map(toDisplayRequest));
    setLogs([...next.records].reverse().map(toLog));
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ledger", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      applyLedger((await response.json()) as Ledger);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal memuat ledger.");
    } finally {
      setLoading(false);
    }
  }, [applyLedger]);

  const postAction = useCallback(
    async (
      type: string,
      payload: Record<string, unknown> = {},
      options: { anchor?: boolean } = {},
    ) => {
      if (options.anchor && !wallet) {
        throw new Error("Hubungkan Phantom dulu supaya transaksi bisa dicatat ke Solana Devnet.");
      }

      const response = await fetch("/api/ledger-action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, payload }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const result = (await response.json()) as {
        ledger?: Ledger;
        hash?: string;
        recordId?: string;
        memo?: LedgerMemo;
        error?: string;
      };
      if (!result.ledger) throw new Error(result.error ?? "Ledger tidak diterima dari server.");
      applyLedger(result.ledger);

      if (options.anchor) {
        const recordId = result.recordId;
        if (!recordId || !result.memo) {
          throw new AnchorError("Server tidak mengembalikan memo transaksi.", {
            recordId: recordId ?? "unknown",
            hash: result.hash,
          });
        }
        if (!wallet) {
          throw new AnchorError("Wallet terputus sebelum transaksi dikirim.", {
            recordId,
            hash: result.hash,
          });
        }
        try {
          const tx = await sendMemoTransaction(result.memo, wallet);
          const attachResponse = await fetch("/api/ledger-tx", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ recordId, tx }),
          });
          if (!attachResponse.ok) throw new Error(await responseError(attachResponse));
          const attached = (await attachResponse.json()) as {
            ledger?: Ledger;
            error?: string;
          };
          if (!attached.ledger) {
            throw new Error(attached.error ?? "Gagal menyimpan bukti transaksi.");
          }
          applyLedger(attached.ledger);
          result.ledger = attached.ledger;
        } catch (cause) {
          const message =
            cause instanceof Error ? cause.message : "Gagal mengirim transaksi Devnet.";
          throw new AnchorError(
            `Data tersimpan lokal, tetapi transaksi Devnet gagal: ${message}. Buka detail aset untuk mencoba anchor ulang.`,
            {
              recordId,
              hash: result.hash,
            },
          );
        }
      }

      return result;
    },
    [applyLedger, wallet],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const provider = getPhantomProvider();
    if (!provider) return;

    const syncWallet = (publicKey?: PhantomPublicKey | null) => {
      if (publicKey === undefined) setWallet(provider.publicKey?.toString() ?? null);
      else setWallet(publicKey?.toString() ?? null);
    };
    const clearWallet = () => setWallet(null);
    provider.on("connect", syncWallet);
    provider.on("accountChanged", syncWallet);
    provider.on("disconnect", clearWallet);

    if (provider.isConnected && provider.publicKey) {
      setWallet(provider.publicKey.toString());
    }

    return () => {
      provider.off?.("connect", syncWallet);
      provider.off?.("accountChanged", syncWallet);
      provider.off?.("disconnect", clearWallet);
    };
  }, []);

  const store: Store = {
    wallet,
    connect: async () => {
      const provider = getPhantomProvider();
      if (!provider) {
        throw new Error("Phantom tidak ditemukan. Pasang ekstensi Phantom lalu coba lagi.");
      }
      const { publicKey } = await provider.connect();
      setWallet(publicKey.toString());
    },
    disconnect: async () => {
      const provider = getPhantomProvider();
      if (provider) await provider.disconnect();
      setWallet(null);
    },
    assets,
    requests,
    logs,
    ledger,
    loading,
    error,
    refresh,
    reset: async () => {
      await postAction("RESET");
    },
    anchorRecord: async (recordId) => {
      if (!wallet) {
        throw new Error("Hubungkan Phantom dulu supaya transaksi bisa dicatat ke Solana Devnet.");
      }
      const record = ledger?.records.find((item) => item.id === recordId);
      if (!record) throw new Error("Record ledger tidak ditemukan.");
      if (record.tx) return record.tx;

      const tx = await sendMemoTransaction(record.memo, wallet);
      const attachResponse = await fetch("/api/ledger-tx", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recordId, tx }),
      });
      if (!attachResponse.ok) throw new Error(await responseError(attachResponse));
      const attached = (await attachResponse.json()) as {
        ledger?: Ledger;
        error?: string;
      };
      if (!attached.ledger) {
        throw new Error(attached.error ?? "Gagal menyimpan bukti transaksi.");
      }
      applyLedger(attached.ledger);
      return tx;
    },
    addAsset: async (input) => {
      let foto = input.foto;
      let fotoHash: string | undefined;
      if (foto?.startsWith("data:")) {
        const uploaded = await uploadPhoto(foto);
        foto = uploaded.url;
        fotoHash = uploaded.sha256;
      }
      await postAction(
        "ADD_ASSET",
        {
          ...input,
          ...(foto ? { foto } : {}),
          ...(fotoHash ? { fotoHash } : {}),
          actorWallet: wallet ?? ADMIN_WALLET,
        },
        { anchor: true },
      );
    },
    createRequest: async (assetId, peminjam, telepon) => {
      await postAction(
        "CREATE_REQUEST",
        {
          assetId,
          peminjam,
          telepon,
          actorWallet: wallet ?? ADMIN_WALLET,
        },
        { anchor: true },
      );
    },
    signRequest: async (id) => {
      try {
        const result = await postAction(
          "SIGN_REQUEST",
          {
            id,
            ...(wallet ? { wallet } : {}),
          },
          { anchor: true },
        );
        if (!result.hash) throw new Error("Hash tanda tangan tidak diterima.");
        return { hash: result.hash, anchored: true };
      } catch (cause) {
        if (cause instanceof AnchorError && cause.hash) {
          return { hash: cause.hash, anchored: false, anchorError: cause.message };
        }
        throw cause;
      }
    },
    returnAsset: async (assetId) => {
      await postAction(
        "RETURN_ASSET",
        {
          assetId,
          actorWallet: wallet ?? ADMIN_WALLET,
        },
        { anchor: true },
      );
    },
    archiveAsset: async (assetId) => {
      await postAction(
        "ARCHIVE_ASSET",
        {
          assetId,
          actorWallet: wallet ?? ADMIN_WALLET,
        },
        { anchor: true },
      );
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export const useStore = () => {
  const store = useContext(Ctx);
  if (!store) throw new Error("StoreProvider hilang");
  return store;
};
