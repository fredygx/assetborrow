import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSignature, History } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Btn, Panel, StatusBadge } from "@/components/ui-kit";
import { shortHash, shortWallet, useStore } from "@/lib/store";

export const Route = createFileRoute("/peminjam")({
  head: () => ({
    meta: [
      { title: "Dasbor Peminjam — Asset Borrow" },
      {
        name: "description",
        content: "Lihat permintaan, tanda tangani perjanjian, dan riwayat peminjaman.",
      },
      { property: "og:title", content: "Dasbor Peminjam — Asset Borrow" },
      {
        property: "og:description",
        content: "Tanda tangani perjanjian peminjaman aset dan catat ke Solana Devnet.",
      },
    ],
  }),
  component: Borrower,
});

function Borrower() {
  const { requests, assets, signRequest } = useStore();
  const [signed, setSigned] = useState<{
    hash: string;
    anchored: boolean;
    error?: string;
  } | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);
  const name = (id: string) => assets.find((a) => a.id === id)?.nama ?? id;
  const pending = requests.filter((r) => r.status === "Menunggu");
  const history = requests.filter((r) => r.status !== "Menunggu");

  const handleSign = async (id: string) => {
    if (signingId) return;
    setSigningId(id);
    try {
      const result = await signRequest(id);
      setSigned({
        hash: result.hash,
        anchored: result.anchored,
        ...(result.anchorError ? { error: result.anchorError } : {}),
      });
      if (result.anchored) {
        toast.success("Perjanjian ditandatangani", {
          description: `Hash ${shortHash(result.hash)} tercatat on-chain di Solana Devnet.`,
        });
      } else {
        toast.warning("Tanda tangan tersimpan lokal", {
          description:
            result.anchorError ??
            "Transaksi Devnet belum tercatat. Buka detail aset untuk anchor ulang.",
        });
      }
    } catch (cause) {
      toast.error("Gagal menandatangani", {
        description: cause instanceof Error ? cause.message : "Coba lagi sebentar.",
      });
    } finally {
      setSigningId(null);
    }
  };

  return (
    <AppShell title="Dasbor Peminjam">
      {signed && (
        <div
          role="status"
          className={
            signed.anchored
              ? "mb-5 flex items-start gap-3 rounded-lg bg-primary/10 px-4 py-3 text-[13px] text-primary ring-1 ring-primary/30"
              : "mb-5 flex items-start gap-3 rounded-lg bg-amber-500/10 px-4 py-3 text-[13px] text-amber-300 ring-1 ring-amber-500/30"
          }
        >
          <FileSignature className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0">
            {signed.anchored
              ? "Perjanjian berhasil ditandatangani dan dicatat ke Solana Devnet."
              : "Perjanjian tersimpan lokal, tetapi transaksi Devnet belum tercatat."}{" "}
            Hash: <span className="break-all font-mono text-[12px]">{signed.hash}</span>
            {signed.error ? (
              <span className="mt-1 block text-[12px] opacity-80">{signed.error}</span>
            ) : null}
          </p>
        </div>
      )}
      <Panel
        eyebrow="Permintaan Masuk"
        title="Menunggu Tanda Tangan"
        right={
          <span className="text-[11px] text-muted-foreground">{pending.length} permintaan</span>
        }
      >
        {pending.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <FileSignature className="size-6 text-muted-foreground/60" aria-hidden="true" />
            <p className="text-[13px] text-muted-foreground">
              Tidak ada permintaan baru yang menunggu tanda tangan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-lg bg-surface px-4 py-3 ring-1 ring-border transition hover:ring-primary/30"
              >
                <span className="rounded bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
                  {r.id}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px]">{name(r.assetId)}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {r.assetId} · diajukan {r.tanggal}
                  </div>
                </div>
                <Btn onClick={() => handleSign(r.id)} disabled={signingId === r.id}>
                  {signingId === r.id ? "Menyimpan..." : "Tanda Tangani Perjanjian"}
                </Btn>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel className="mt-5" eyebrow="Bukti On-Chain" title="Riwayat Peminjaman">
        {history.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <History className="size-6 text-muted-foreground/60" aria-hidden="true" />
            <p className="text-[13px] text-muted-foreground">
              Belum ada riwayat. Tanda tangani permintaan untuk memulai.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg ring-1 ring-border">
            <table className="w-full min-w-[620px] text-left text-[13px]">
              <thead>
                <tr className="bg-surface text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Aset</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Wallet</th>
                  <th className="px-4 py-2.5 font-medium">Hash</th>
                  <th className="px-4 py-2.5 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-surface/40">
                    <td className="px-4 py-3">
                      <Link
                        to="/aset/$id"
                        params={{ id: r.assetId }}
                        className="hover:text-primary"
                      >
                        {name(r.assetId)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{shortWallet(r.wallet)}</td>
                    <td className="px-4 py-3 text-[11px] text-primary">{shortHash(r.hash)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.waktu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
