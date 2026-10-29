import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  AppShell,
  AssetPhoto,
  BarChart,
  Btn,
  Panel,
  StatusBadge,
  inputCls,
} from "@/components/ui-kit";
import { AnchorError, shortHash, useStore, type Asset } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Dasbor Admin — Asset Borrow" },
      { name: "description", content: "Kelola aset dan buat permintaan peminjaman." },
      { property: "og:title", content: "Dasbor Admin — Asset Borrow" },
      { property: "og:description", content: "Kelola aset dan buat permintaan peminjaman." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { assets, requests, addAsset, createRequest, returnAsset, archiveAsset } = useStore();
  const [f, setF] = useState({ nama: "", kondisi: "Baik", kategori: "" });
  const [foto, setFoto] = useState<string | null>(null);
  const [savingAsset, setSavingAsset] = useState(false);
  const [savingRequest, setSavingRequest] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);
  const activeAssets = assets.filter((a) => a.status !== "Diarsipkan");
  const archivedAssets = assets.filter((a) => a.status === "Diarsipkan");
  const tersedia = activeAssets.filter((a) => a.status !== "Dipinjam");
  const hasActiveRequest = (assetId: string) =>
    requests.some(
      (request) =>
        request.assetId === assetId &&
        (request.status === "Menunggu" || request.status === "Ditandatangani"),
    );
  const [r, setR] = useState({
    assetId: "",
    peminjam: "Budi Mahasiswa",
    telepon: "0812-0000-1111",
  });
  const counts = (s: string) => assets.filter((a) => a.status === s).length;
  const chartValues = [2, 3, 2, 4, 5, 6, 3 + requests.length];
  const chartTotal = chartValues.reduce((sum, v) => sum + v, 0);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      e.target.value = "";
      return;
    }
    if (file.size > 1_500_000) {
      toast.error("Ukuran foto maksimal 1,5 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFoto(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => toast.error("Foto gagal dibaca. Coba file lain.");
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setF({ nama: "", kondisi: "Baik", kategori: "" });
    setFoto(null);
    if (fotoRef.current) fotoRef.current.value = "";
  };

  const handleArchive = async (asset: Asset) => {
    if (archivingId) return;
    const confirmed = window.confirm(
      `Hapus "${asset.nama}" dari daftar aktif?\n\nAset akan diarsipkan, bukan dihapus permanen. Riwayat dan hash tetap tersimpan.`,
    );
    if (!confirmed) return;
    setArchivingId(asset.id);
    try {
      await archiveAsset(asset.id);
      toast.success("Aset dihapus dari daftar aktif", {
        description: `${asset.nama} diarsipkan. Riwayat dan hash tetap tersimpan.`,
      });
    } catch (cause) {
      if (cause instanceof AnchorError) {
        toast.warning("Aset diarsipkan lokal", {
          description: cause.message,
        });
      } else {
        toast.error("Gagal menghapus aset", {
          description: cause instanceof Error ? cause.message : "Coba lagi sebentar.",
        });
      }
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <AppShell title="Dasbor Admin">
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Aset Aktif", activeAssets.length, "text-foreground"],
          ["Tersedia", counts("Tersedia"), "text-avail"],
          ["Dipinjam", counts("Dipinjam"), "text-warn"],
          ["Dikembalikan", counts("Dikembalikan"), "text-info"],
        ].map(([l, v, c]) => (
          <div key={l as string} className="rounded-xl bg-card p-4 ring-1 ring-border">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{l}</div>
            <div className={`mt-2 font-display text-3xl font-semibold ${c}`}>{v}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <Panel
          eyebrow="Data Off-Chain"
          title="Aset & Status"
          right={
            <span className="text-[11px] text-muted-foreground">
              {activeAssets.length} aset aktif
              {archivedAssets.length > 0 && ` · ${archivedAssets.length} diarsipkan`}
            </span>
          }
        >
          <div className="overflow-x-auto rounded-lg ring-1 ring-border">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="bg-surface text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Aset</th>
                  <th className="px-4 py-2.5 font-medium">Kondisi</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Hash</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeAssets.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-surface/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AssetPhoto asset={a} variant="thumb" />
                        <div className="min-w-0">
                          <Link
                            to="/aset/$id"
                            params={{ id: a.id }}
                            className="block truncate hover:text-primary"
                          >
                            {a.nama}
                          </Link>
                          <div className="text-[11px] text-muted-foreground">{a.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.kondisi}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-[11px] text-primary">{shortHash(a.hash)}</td>
                    <td className="px-4 py-3 text-right">
                      {a.status === "Dipinjam" ? (
                        <Btn
                          variant="ghost"
                          disabled={returningId === a.id}
                          onClick={async () => {
                            setReturningId(a.id);
                            try {
                              await returnAsset(a.id);
                              toast.success("Aset ditandai kembali", {
                                description: `${a.nama} masuk ke riwayat pengembalian.`,
                              });
                            } catch (cause) {
                              if (cause instanceof AnchorError) {
                                toast.warning("Pengembalian tersimpan lokal", {
                                  description: cause.message,
                                });
                              } else {
                                toast.error("Gagal menandai pengembalian", {
                                  description:
                                    cause instanceof Error ? cause.message : "Coba lagi sebentar.",
                                });
                              }
                            } finally {
                              setReturningId(null);
                            }
                          }}
                        >
                          {returningId === a.id ? "Menyimpan..." : "Tandai Kembali"}
                        </Btn>
                      ) : hasActiveRequest(a.id) ? (
                        <span className="text-[11px] text-muted-foreground">
                          Ada permintaan aktif
                        </span>
                      ) : (
                        <Btn
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          disabled={archivingId === a.id}
                          onClick={() => handleArchive(a)}
                        >
                          {archivingId === a.id ? "Menghapus..." : "Hapus"}
                        </Btn>
                      )}
                    </td>
                  </tr>
                ))}
                {activeAssets.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-[12px] text-muted-foreground"
                    >
                      Tidak ada aset aktif. Tambahkan aset baru di bawah.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {archivedAssets.length > 0 && (
            <div className="mt-3 rounded-lg border border-dashed border-border px-3 py-2">
              <button
                type="button"
                onClick={() => setShowArchived((value) => !value)}
                className="flex w-full items-center justify-between gap-3 text-left text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                <span>Aset diarsipkan ({archivedAssets.length})</span>
                <span className="text-primary">{showArchived ? "Sembunyikan" : "Lihat"}</span>
              </button>
              {showArchived && (
                <ul className="mt-2 divide-y divide-border border-t border-border">
                  {archivedAssets.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 py-2 text-[12px]"
                    >
                      <Link
                        to="/aset/$id"
                        params={{ id: a.id }}
                        className="truncate hover:text-primary"
                      >
                        {a.nama}
                      </Link>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{a.id}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Panel>
        <Panel
          eyebrow="Aktivitas 7 Hari"
          title="Peminjaman"
          right={<span className="text-[11px] text-muted-foreground">{chartTotal} peminjaman</span>}
        >
          <BarChart values={chartValues} />
        </Panel>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel eyebrow="Off-Chain" title="Tambah Aset">
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const nama = f.nama.trim();
              if (!nama || savingAsset) return;
              setSavingAsset(true);
              try {
                await addAsset({
                  nama,
                  kondisi: f.kondisi,
                  kategori: f.kategori.trim(),
                  ...(foto ? { foto } : {}),
                });
                toast.success("Aset ditambahkan", {
                  description: `${nama} masuk ke inventaris sebagai aset tersedia.`,
                });
                resetForm();
              } catch (cause) {
                if (cause instanceof AnchorError) {
                  toast.warning("Aset tersimpan lokal", {
                    description: cause.message,
                  });
                  resetForm();
                } else {
                  toast.error("Aset gagal disimpan", {
                    description: cause instanceof Error ? cause.message : "Coba lagi sebentar.",
                  });
                }
              } finally {
                setSavingAsset(false);
              }
            }}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <label className="group relative grid size-20 cursor-pointer place-items-center overflow-hidden rounded-lg bg-surface text-[10px] text-muted-foreground ring-1 ring-dashed ring-border transition hover:ring-primary/50">
                  {foto ? (
                    <>
                      <img
                        src={foto}
                        alt="Pratinjau foto aset"
                        className="absolute inset-0 size-full object-cover"
                      />
                      <span className="absolute inset-0 grid place-items-center bg-background/65 opacity-0 transition group-hover:opacity-100">
                        <Camera className="size-5 text-primary" aria-hidden="true" />
                      </span>
                    </>
                  ) : (
                    <span className="flex flex-col items-center gap-1">
                      <ImagePlus className="size-5 text-primary/80" aria-hidden="true" />
                      <span>Foto</span>
                    </span>
                  )}
                  <input
                    ref={fotoRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handlePhoto}
                    aria-label="Unggah foto aset"
                  />
                </label>
                {foto && (
                  <button
                    type="button"
                    onClick={() => {
                      setFoto(null);
                      if (fotoRef.current) fotoRef.current.value = "";
                    }}
                    className="mt-1.5 w-20 text-center text-[10px] text-muted-foreground transition hover:text-destructive"
                  >
                    Hapus foto
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <input
                  className={inputCls}
                  placeholder="Nama aset, mis. Mikrofon Shure"
                  value={f.nama}
                  onChange={(e) => setF({ ...f, nama: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="Kategori, mis. Audio Visual"
                  value={f.kategori}
                  onChange={(e) => setF({ ...f, kategori: e.target.value })}
                />
              </div>
            </div>
            <select
              className={inputCls}
              value={f.kondisi}
              onChange={(e) => setF({ ...f, kondisi: e.target.value })}
            >
              <option>Baik</option>
              <option>Lecet ringan</option>
              <option>Perlu servis</option>
            </select>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                Foto → <code>data/uploads/</code> · data → <code>data/ledger.json</code>
              </p>
              <Btn type="submit" disabled={!f.nama.trim() || savingAsset}>
                {savingAsset ? "Menyimpan..." : "Tambah Aset"}
              </Btn>
            </div>
          </form>
        </Panel>
        <Panel eyebrow="Alur Peminjaman" title="Buat Permintaan Peminjaman">
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!r.assetId || savingRequest) return;
              const asset = assets.find((a) => a.id === r.assetId);
              setSavingRequest(true);
              try {
                await createRequest(r.assetId, r.peminjam, r.telepon);
                toast.success("Permintaan peminjaman dibuat", {
                  description: `${r.peminjam} · ${asset?.nama ?? r.assetId}`,
                });
                setR({ ...r, assetId: "" });
              } catch (cause) {
                if (cause instanceof AnchorError) {
                  toast.warning("Permintaan tersimpan lokal", {
                    description: cause.message,
                  });
                  setR({ ...r, assetId: "" });
                } else {
                  toast.error("Permintaan gagal dibuat", {
                    description: cause instanceof Error ? cause.message : "Coba lagi sebentar.",
                  });
                }
              } finally {
                setSavingRequest(false);
              }
            }}
          >
            <select
              className={inputCls}
              value={r.assetId}
              onChange={(e) => setR({ ...r, assetId: e.target.value })}
            >
              <option value="">Pilih aset…</option>
              {tersedia.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.nama}
                </option>
              ))}
            </select>
            <input
              className={inputCls}
              placeholder="Nama peminjam"
              value={r.peminjam}
              onChange={(e) => setR({ ...r, peminjam: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="Telepon"
              value={r.telepon}
              onChange={(e) => setR({ ...r, telepon: e.target.value })}
            />
            <Btn type="submit" disabled={!r.assetId || savingRequest}>
              {savingRequest ? "Menyimpan..." : "Kirim Permintaan"}
            </Btn>
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}
