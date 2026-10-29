import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  FileJson,
  FolderOpen,
  Image as ImageIcon,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Btn, Panel, StatusBadge } from "@/components/ui-kit";
import { EVENT_LABEL, formatDateTime } from "@/lib/ledger";
import { shortHash, shortWallet, useStore } from "@/lib/store";

export const Route = createFileRoute("/bukti")({
  head: () => ({
    meta: [
      { title: "Bukti Penyimpanan — Asset Borrow" },
      {
        name: "description",
        content: "Lokasi file JSON ledger dan folder foto aset untuk demo ke dosen.",
      },
    ],
  }),
  component: BuktiPage,
});

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-surface px-3 py-2 ring-1 ring-border">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg font-semibold">{value}</div>
    </div>
  );
}

function BuktiPage() {
  const { ledger, assets, loading, error, refresh, reset } = useStore();
  const [busy, setBusy] = useState(false);
  const photos = assets.filter((asset) => asset.foto);
  const records = ledger?.records ?? [];
  const onChain = records.filter((record) => record.tx).length;

  const copyPath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      toast.success("Path disalin", { description: path });
    } catch {
      toast.error("Gagal menyalin path", { description: "Salin manual dari kotak kode." });
    }
  };

  const handleRefresh = async () => {
    setBusy(true);
    await refresh();
    setBusy(false);
    toast.success("Ledger dimuat ulang dari disk");
  };

  const handleReset = async () => {
    if (!window.confirm("Kembalikan ledger ke data seed? Perubahan demo akan hilang.")) return;
    setBusy(true);
    try {
      await reset();
      toast.success("Ledger direset ke seed");
    } catch (cause) {
      toast.error("Gagal reset ledger", {
        description: cause instanceof Error ? cause.message : "Coba lagi sebentar.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Bukti Penyimpanan">
      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Panel
          eyebrow="File JSON"
          title="data/ledger.json"
          right={
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] text-primary ring-1 ring-primary/25">
              {ledger?.network ?? "memuat..."}
            </span>
          }
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <FileJson className="size-5 text-primary" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Semua aset, permintaan, dan record hash disimpan di file ini. Buka langsung dari
                folder project untuk ditunjukkan ke dosen.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="rounded bg-surface px-2 py-1 text-[12px] text-primary ring-1 ring-border">
                  data/ledger.json
                </code>
                <Btn variant="ghost" onClick={() => copyPath("data/ledger.json")}>
                  <Copy className="mr-1 inline size-3.5" aria-hidden="true" /> Salin
                </Btn>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Aset" value={ledger?.assets.length ?? 0} />
            <Stat label="Permintaan" value={ledger?.requests.length ?? 0} />
            <Stat label="Record" value={records.length} />
            <Stat label="On-chain" value={onChain} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href="/api/ledger"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground transition hover:opacity-90"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" /> Lihat JSON
            </a>
            <a
              href="/api/ledger?download=1"
              className="inline-flex items-center gap-1.5 rounded-md bg-surface px-3 py-2 text-[13px] font-medium ring-1 ring-border transition hover:bg-secondary"
            >
              <Database className="size-3.5" aria-hidden="true" /> Unduh
            </a>
            <Btn variant="ghost" onClick={handleRefresh} disabled={busy}>
              <RefreshCw className="mr-1 inline size-3.5" aria-hidden="true" /> Muat ulang
            </Btn>
            <Btn variant="ghost" onClick={handleReset} disabled={busy}>
              <RotateCcw className="mr-1 inline size-3.5" aria-hidden="true" /> Reset seed
            </Btn>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Terakhir disimpan: {formatDateTime(ledger?.updatedAt)} · lastHash:{" "}
            <span className="font-mono text-primary">
              {shortHash(ledger?.lastHash ?? undefined)}
            </span>
          </p>
          {error && <p className="mt-2 text-[12px] text-destructive">{error}</p>}
        </Panel>

        <Panel
          eyebrow="Folder Gambar"
          title="data/uploads/"
          right={<span className="text-[11px] text-muted-foreground">{photos.length} foto</span>}
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <FolderOpen className="size-5 text-primary" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Foto aset tidak disimpan sebagai base64 di JSON. File asli ditulis ke folder ini,
                lalu ledger hanya menyimpan URL dan hash-nya.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="rounded bg-surface px-2 py-1 text-[12px] text-primary ring-1 ring-border">
                  data/uploads/
                </code>
                <Btn variant="ghost" onClick={() => copyPath("data/uploads")}>
                  <Copy className="mr-1 inline size-3.5" aria-hidden="true" /> Salin
                </Btn>
              </div>
            </div>
          </div>
          {photos.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-center">
              <ImageIcon className="size-6 text-muted-foreground/60" aria-hidden="true" />
              <p className="text-[12px] text-muted-foreground">
                Belum ada foto. Tambah aset dengan foto di Dasbor Admin.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {photos.map((asset) => (
                <Link
                  key={asset.id}
                  to="/aset/$id"
                  params={{ id: asset.id }}
                  className="group rounded-lg bg-surface p-2 ring-1 ring-border transition hover:ring-primary/40"
                >
                  {asset.foto && (
                    <img
                      src={asset.foto}
                      alt={`Foto ${asset.nama}`}
                      className="aspect-square w-full rounded-md object-cover ring-1 ring-border"
                    />
                  )}
                  <div className="mt-1 truncate text-[10px] text-muted-foreground">{asset.id}</div>
                </Link>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            File disajikan lewat <code>/api/uploads/&lt;nama-file&gt;</code>.
          </p>
        </Panel>
      </div>

      <Panel
        eyebrow="Audit Trail"
        title="Record Ledger"
        right={
          <span className="inline-flex items-center gap-1 text-[11px] text-avail">
            <CheckCircle2 className="size-3.5" aria-hidden="true" /> {records.length} record
          </span>
        }
      >
        {loading && records.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Memuat ledger dari disk...</p>
        ) : records.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Belum ada record.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg ring-1 ring-border">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead>
                <tr className="bg-surface text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Seq</th>
                  <th className="px-3 py-2.5 font-medium">Event</th>
                  <th className="px-3 py-2.5 font-medium">Aset</th>
                  <th className="px-3 py-2.5 font-medium">Hash</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Wallet</th>
                  <th className="px-3 py-2.5 font-medium">On-chain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...records].reverse().map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-surface/40">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
                      {record.seq}
                    </td>
                    <td className="px-3 py-2.5">{EVENT_LABEL[record.type]}</td>
                    <td className="px-3 py-2.5">
                      <Link
                        to="/aset/$id"
                        params={{ id: record.assetId }}
                        className="hover:text-primary"
                      >
                        {record.assetId}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-primary">
                      {shortHash(record.hash)}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={record.assetStatusAfter ?? "—"} />
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                      {shortWallet(record.actorWallet)}
                    </td>
                    <td className="px-3 py-2.5 text-[11px]">
                      {record.tx ? (
                        <a
                          href={record.tx.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {record.tx.status}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">belum on-chain</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className="mt-5" eyebrow="Cara Demo" title="Langkah Membuktikan ke Dosen">
        <ol className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
          <li>
            <span className="mr-2 font-mono text-primary">1.</span> Buka folder project di
            Explorer/Finder.
          </li>
          <li>
            <span className="mr-2 font-mono text-primary">2.</span> Buka{" "}
            <code className="text-foreground">data/ledger.json</code>; tunjukkan array{" "}
            <code className="text-foreground">records</code>,{" "}
            <code className="text-foreground">lastHash</code>, dan{" "}
            <code className="text-foreground">salt</code>.
          </li>
          <li>
            <span className="mr-2 font-mono text-primary">3.</span> Buka{" "}
            <code className="text-foreground">data/uploads/</code>; tunjukkan file gambar aset yang
            baru diunggah.
          </li>
          <li>
            <span className="mr-2 font-mono text-primary">4.</span> Hubungkan Phantom yang berada di
            jaringan <strong className="text-foreground">Devnet</strong> dan punya saldo SOL Devnet.
            Tambah aset + foto dari Dasbor Admin, lalu setujui transaksi di Phantom.
          </li>
          <li>
            <span className="mr-2 font-mono text-primary">5.</span> Setelah status{" "}
            <strong className="text-foreground">confirmed</strong>, klik kolom{" "}
            <strong className="text-foreground">On-chain</strong> untuk membuka Solana Explorer
            Devnet. Cocokkan memo dengan <code className="text-foreground">records[].memo</code>.
          </li>
          <li>
            <span className="mr-2 font-mono text-primary">6.</span> Cocokkan hash di tabel dengan{" "}
            <code className="text-foreground">records[].hash</code> di JSON. Hash dibentuk dari
            SHA-256 isi record + <code className="text-foreground">prevHash</code> +{" "}
            <code className="text-foreground">salt</code>.
          </li>
        </ol>
        <p className="mt-4 rounded-lg bg-surface px-3 py-2 text-[12px] leading-relaxed text-muted-foreground ring-1 ring-border">
          Catatan: file ini tersimpan di komputer yang menjalankan server. Untuk demo ke dosen,
          jalankan <code className="text-foreground">npm run dev</code> di laptop dan gunakan
          Phantom Devnet. Kalau aplikasi di-deploy ke Cloudflare, penyimpanan file lokal tidak
          tersedia.
        </p>
      </Panel>
    </AppShell>
  );
}
