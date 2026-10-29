import { createFileRoute, Link } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { AppShell, Panel, StatusBadge } from "@/components/ui-kit";
import { shortHash, shortWallet, useStore } from "@/lib/store";

export const Route = createFileRoute("/auditor")({
  head: () => ({
    meta: [
      { title: "Log Audit — Asset Borrow" },
      { name: "description", content: "Semua hash transaksi dan perubahan status aset." },
      { property: "og:title", content: "Log Audit — Asset Borrow" },
      {
        property: "og:description",
        content: "Jejak audit Solana Devnet untuk peminjaman aset.",
      },
    ],
  }),
  component: Auditor,
});

function Auditor() {
  const { logs } = useStore();
  return (
    <AppShell title="Jejak Audit Aset">
      <Panel
        eyebrow="Bukti On-Chain"
        title="Rantai Blok Solana Devnet"
        right={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="flex items-center gap-1.5 text-[11px] text-avail">
              <span className="size-1.5 rounded-full bg-avail" aria-hidden="true" />
              Rantai valid
            </span>
            <span className="text-[11px] text-muted-foreground">{logs.length} transaksi</span>
          </div>
        }
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
            <ScrollText className="size-6 text-muted-foreground/60" aria-hidden="true" />
            <p className="text-[13px] text-muted-foreground">
              Belum ada transaksi tercatat di Solana Devnet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="hidden gap-2 px-4 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground md:grid md:grid-cols-[70px_1fr_110px_120px_150px_130px]">
              <span>Blok</span>
              <span>Aksi</span>
              <span>Status</span>
              <span>Wallet</span>
              <span>Hash</span>
              <span className="text-right">Waktu</span>
            </div>
            {logs.map((l, i) => (
              <div
                key={l.id}
                className="grid gap-2 rounded-lg bg-surface px-4 py-3 ring-1 ring-border transition hover:ring-primary/30 md:grid-cols-[70px_1fr_110px_120px_150px_130px] md:items-center"
              >
                <span className="w-fit rounded bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
                  #{4800 + logs.length - i}
                </span>
                <span className="text-[13px]">
                  {l.aksi} —{" "}
                  <Link
                    to="/aset/$id"
                    params={{ id: l.assetId }}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {l.assetId}
                  </Link>
                </span>
                <span>
                  <StatusBadge status={l.status} />
                </span>
                <span className="text-[11px] text-muted-foreground">{shortWallet(l.wallet)}</span>
                <span className="text-[11px] text-primary" title={l.hash}>
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
                <span className="text-[11px] text-muted-foreground md:text-right">{l.waktu}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
