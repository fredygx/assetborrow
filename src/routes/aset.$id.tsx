import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, AssetPhoto, Btn, Panel, StatusBadge } from "@/components/ui-kit";
import { shortHash, shortWallet, useStore } from "@/lib/store";

export const Route = createFileRoute("/aset/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Verifikasi ${params.id} — Asset Borrow` },
      { name: "description", content: `Bukti peminjaman dan verifikasi aset ${params.id}.` },
      { property: "og:title", content: `Verifikasi ${params.id} — Asset Borrow` },
      {
        property: "og:description",
        content: "Bukti on-chain Solana Devnet untuk aset organisasi.",
      },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { assets, requests, logs, anchorRecord, wallet } = useStore();
  const [anchoring, setAnchoring] = useState(false);
  const a = assets.find((x) => x.id === id);
  if (!a)
    return (
      <AppShell title="Aset tidak ditemukan">
        <Link to="/admin" className="text-primary">
          ← Kembali ke Dasbor Admin
        </Link>
      </AppShell>
    );
  const req = [...requests].reverse().find((r) => r.assetId === id && r.wallet);
  const last = logs.find((l) => l.assetId === id);
  const assetLogs = logs.filter((l) => l.assetId === id);
  const row = (k: string, v: React.ReactNode) => (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2.5 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="break-all text-right">{v}</span>
    </div>
  );
  const copyHash = async () => {
    if (!a.hash) return;
    try {
      await navigator.clipboard.writeText(a.hash);
      toast.success("Hash disalin", { description: shortHash(a.hash) });
    } catch {
      toast.error("Gagal menyalin hash. Salin manual dari teks di atas.");
    }
  };

  return (
    <AppShell title="Detail Aset / Verifikasi">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Dasbor Admin
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">{a.id}</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Panel eyebrow="Data Off-Chain" title={a.nama}>
          <AssetPhoto asset={a} className="mb-4" />
          <div className="text-[13px]">
            {row("Nama Aset", a.nama)}
            {row("Kategori", a.kategori || "—")}
            {row("Kondisi", a.kondisi)}
            {row("Peminjam", req?.peminjam ?? "—")}
            {row("Telepon", req?.telepon ?? "—")}
          </div>
        </Panel>
        <Panel eyebrow="Bukti On-Chain" title="Bukti Peminjaman">
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-background p-4 text-[13px] leading-7 ring-1 ring-primary/30">
            {`Asset ID: ${a.id}
Status: ${a.status}
Verification Hash: ${a.hash ? a.hash.slice(0, 8) + "..." : "—"}
Network: Solana Devnet (Memo Program)`}
          </pre>
          <div className="mt-4 text-[13px]">
            {row("Status", <StatusBadge status={a.status} />)}
            {last?.tx &&
              row(
                "Transaksi Devnet",
                <a
                  href={last.tx.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {shortHash(last.tx.signature)} ↗
                </a>,
              )}
            {row(
              "Hash Lengkap",
              <span className="inline-flex flex-wrap items-center justify-end gap-2">
                <span className="font-mono text-[11px] text-primary">
                  {a.hash ?? "Belum ada transaksi"}
                </span>
                {a.hash && (
                  <button
                    type="button"
                    onClick={copyHash}
                    className="inline-flex items-center gap-1 rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground ring-1 ring-border transition hover:text-foreground"
                  >
                    <Copy className="size-3" aria-hidden="true" />
                    Salin
                  </button>
                )}
              </span>,
            )}
            {row("Wallet", shortWallet(last?.wallet))}
            {row("Timestamp", last?.waktu ?? "—")}
          </div>
          {last && !last.tx && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-500/10 px-3 py-2.5 text-[12px] text-amber-300 ring-1 ring-amber-500/30">
              <span>Catatan terakhir belum punya transaksi Devnet.</span>
              <Btn
                type="button"
                variant="ghost"
                disabled={!wallet || anchoring}
                className="px-2.5 py-1 text-[12px]"
                onClick={async () => {
                  setAnchoring(true);
                  try {
                    await anchorRecord(last.id);
                    toast.success("Transaksi Devnet tercatat", {
                      description: `${last.id} · ${last.aksi}`,
                    });
                  } catch (cause) {
                    toast.error("Anchor gagal", {
                      description: cause instanceof Error ? cause.message : "Coba lagi sebentar.",
                    });
                  } finally {
                    setAnchoring(false);
                  }
                }}
              >
                {anchoring ? "Mengirim..." : wallet ? "Anchor ke Devnet" : "Hubungkan Phantom"}
              </Btn>
            </div>
          )}
        </Panel>
      </div>
      <Panel
        className="mt-5"
        eyebrow="Bukti On-Chain"
        title="Jejak Transaksi Aset"
        right={
          <span className="text-[11px] text-muted-foreground">{assetLogs.length} transaksi</span>
        }
      >
        {assetLogs.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            Belum ada transaksi untuk aset ini. Transaksi akan muncul setelah aset dipinjam atau
            dikembalikan.
          </p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-5">
            {assetLogs.map((l) => (
              <li key={l.id} className="relative">
                <span
                  className="absolute -left-[24px] top-1 size-2 rounded-full bg-primary ring-4 ring-card"
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium">{l.aksi}</span>
                  <StatusBadge status={l.status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                  <span>{l.waktu}</span>
                  <span aria-hidden="true">·</span>
                  <span>{shortWallet(l.wallet)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-primary" title={l.hash}>
                    {l.tx ? (
                      <a
                        href={l.tx.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {shortHash(l.hash)} ↗
                      </a>
                    ) : (
                      shortHash(l.hash)
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </AppShell>
  );
}
