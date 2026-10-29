import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Boxes,
  Check,
  ClipboardCheck,
  Database,
  FileSignature,
  Link2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Panel, SimBanner, WalletButton } from "@/components/ui-kit";
import { shortWallet, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Asset Borrow — Peminjaman Aset Organisasi Terverifikasi" },
      {
        name: "description",
        content: "Lacak peminjaman aset organisasi dengan jejak audit Solana Devnet.",
      },
      { property: "og:title", content: "Asset Borrow — Peminjaman Aset Terverifikasi" },
      {
        property: "og:description",
        content: "Lacak peminjaman aset organisasi dengan jejak audit Solana Devnet.",
      },
    ],
  }),
  component: Landing,
});

const navLinks = [
  { to: "/admin", label: "Admin" },
  { to: "/peminjam", label: "Peminjam" },
  { to: "/auditor", label: "Audit" },
  { to: "/bukti", label: "Bukti" },
] as const;

const roles = [
  {
    to: "/admin",
    t: "Admin Inventaris",
    d: "Tambah aset, unggah foto, dan buat permintaan peminjaman.",
    icon: Boxes,
  },
  {
    to: "/peminjam",
    t: "Peminjam (Mahasiswa)",
    d: "Tanda tangani perjanjian dan pantau riwayat peminjaman.",
    icon: FileSignature,
  },
  {
    to: "/auditor",
    t: "Auditor",
    d: "Telusuri hash transaksi dan setiap perubahan status aset.",
    icon: ShieldCheck,
  },
] as const;

const steps = [
  {
    n: "01",
    t: "Registrasi aset",
    d: "Admin menyimpan foto ke data/uploads/, lalu mencatat aset dan hash ke data/ledger.json.",
    icon: ClipboardCheck,
  },
  {
    n: "02",
    t: "Tanda tangan perjanjian",
    d: "Peminjam menandatangani perjanjian; status dan hash dicatat ke Solana Devnet lewat Memo Program.",
    icon: FileSignature,
  },
  {
    n: "03",
    t: "Pengembalian & audit",
    d: "Admin menandai pengembalian, auditor menelusuri seluruh jejak perubahan status.",
    icon: RotateCcw,
  },
] as const;

const offChain = [
  "Foto dan kondisi aset",
  "Nama, telepon, dan catatan peminjam",
  "Riwayat internal organisasi",
];

const onChain = ["Hash transaksi", "Status aset dan wallet", "Timestamp perubahan status"];

function Landing() {
  const { wallet, assets, logs } = useStore();
  const activeAssets = assets.filter((asset) => asset.status !== "Diarsipkan");
  const stats = [
    { label: "Aset aktif", value: String(activeAssets.length) },
    { label: "Transaksi tercatat", value: String(logs.length) },
    { label: "Mode jaringan", value: "Devnet" },
  ];

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/30">
              <span className="size-2 rounded-full bg-primary" />
            </span>
            <span className="font-display text-[15px] font-semibold">Asset Borrow</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {navLinks.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-md px-3 py-2 text-[13px] text-muted-foreground transition hover:bg-surface hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <WalletButton />
        </header>

        <SimBanner />

        <section className="py-10">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Sistem Peminjaman Aset Organisasi Terverifikasi
          </div>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            Setiap peminjaman tercatat.{" "}
            <span className="text-primary">Setiap sengketa terjawab.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            Asset Borrow membantu admin inventaris dan mahasiswa melacak peminjaman aset dengan
            jejak audit berbasis hash. Data pribadi disimpan Off-chain, sedangkan bukti status
            dicatat On-chain di Solana Devnet.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <WalletButton />
            {wallet && (
              <span className="text-[12px] text-primary">
                Terhubung ke Phantom sebagai {shortWallet(wallet)}
              </span>
            )}
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-[13px] text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
            >
              Buka dasbor
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-card/60 px-3 py-2.5 ring-1 ring-border">
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-1 font-display text-xl font-semibold text-foreground">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.to}
                to={r.to}
                className="group flex flex-col rounded-xl bg-card p-5 ring-1 ring-border transition hover:-translate-y-0.5 hover:ring-primary/40"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-[16px] font-semibold">{r.t}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{r.d}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                  Buka dasbor
                  <ArrowUpRight
                    className="size-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            );
          })}
        </div>

        <section className="mt-14">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Cara kerja
          </div>
          <h2 className="mt-2 text-2xl font-semibold">Tiga langkah, satu jejak audit.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="rounded-xl bg-card p-5 ring-1 ring-border">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-primary">{s.n}</span>
                    <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-[15px] font-semibold">{s.t}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Panel
            eyebrow="Data Off-Chain"
            title="Disimpan di server organisasi"
            right={<Database className="size-4 text-muted-foreground" aria-hidden="true" />}
          >
            <ul className="space-y-2 text-[13px] text-muted-foreground">
              {offChain.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-avail" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel
            eyebrow="Bukti On-Chain"
            title="Dicatat sebagai bukti (Devnet)"
            right={<Link2 className="size-4 text-muted-foreground" aria-hidden="true" />}
          >
            <ul className="space-y-2 text-[13px] text-muted-foreground">
              {onChain.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <footer className="mt-14 border-t border-border pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/30">
                <span className="size-1.5 rounded-full bg-primary" />
              </span>
              <div>
                <div className="font-display text-[13px] font-semibold">Asset Borrow</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Prototipe Modul 2
                </div>
              </div>
            </div>
            <nav className="flex flex-wrap gap-4 text-[12px] text-muted-foreground">
              {navLinks.map((n) => (
                <Link key={n.to} to={n.to} className="transition hover:text-foreground">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Aplikasi demo Solana Devnet. Tidak pernah meminta private key atau seed phrase.
          </p>
        </footer>
      </div>
    </div>
  );
}
