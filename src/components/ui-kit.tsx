import { Link } from "@tanstack/react-router";
import { Boxes, Camera, Laptop, Projector, Speaker } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { shortWallet, useStore, type Asset, type AssetStatus } from "@/lib/store";

export const SIM_WARNING =
  "Transaksi dicatat ke Solana Devnet melalui Memo Program. Pastikan Phantom terhubung ke Devnet dan memiliki saldo SOL Devnet untuk biaya transaksi.";

export function SimBanner() {
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-lg border border-warn/30 bg-warn/10 px-4 py-3"
    >
      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-warn" />
      <p className="text-[13px] leading-relaxed text-warn">{SIM_WARNING}</p>
    </div>
  );
}

const badge: Record<string, string> = {
  Tersedia: "bg-avail/15 text-avail ring-avail/30",
  Dipinjam: "bg-warn/15 text-warn ring-warn/30",
  Dikembalikan: "bg-info/15 text-info ring-info/30",
  Diarsipkan: "bg-surface text-muted-foreground ring-border",
  Menunggu: "bg-surface text-muted-foreground ring-border",
  Ditandatangani: "bg-primary/15 text-primary ring-primary/30",
  Selesai: "bg-info/15 text-info ring-info/30",
};
export function StatusBadge({ status }: { status: AssetStatus | string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${badge[status] ?? badge["Menunggu"]}`}
    >
      {status}
    </span>
  );
}

function categoryIcon(asset: Asset) {
  const text = `${asset.nama} ${asset.kategori}`.toLowerCase();
  if (text.includes("kamera")) return Camera;
  if (text.includes("laptop") || text.includes("komputer")) return Laptop;
  if (text.includes("proyektor") || text.includes("projektor")) return Projector;
  if (text.includes("speaker") || text.includes("audio")) return Speaker;
  return Boxes;
}

export function AssetPhoto({
  asset,
  variant = "full",
  className = "",
}: {
  asset: Asset;
  variant?: "full" | "thumb";
  className?: string;
}) {
  const Icon = categoryIcon(asset);

  if (asset.foto) {
    const photoCls =
      variant === "thumb"
        ? "size-10 shrink-0 rounded-md object-cover ring-1 ring-border"
        : "aspect-video w-full rounded-lg object-cover ring-1 ring-border";
    return (
      <img src={asset.foto} alt={`Foto ${asset.nama}`} className={`${photoCls} ${className}`} />
    );
  }

  if (variant === "thumb") {
    return (
      <div
        className={`grid size-10 shrink-0 place-items-center rounded-md bg-surface ring-1 ring-border ${className}`}
      >
        <Icon className="size-4 text-primary/80" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className={`relative grid aspect-video place-items-center overflow-hidden rounded-lg bg-surface ring-1 ring-border ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(80,220,160,0.16),transparent_60%)]" />
      <div className="relative flex flex-col items-center gap-2 px-6 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Icon className="size-6 text-primary" aria-hidden="true" />
        </span>
        <span className="text-[12px] text-muted-foreground">Foto aset belum diunggah</span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
          {asset.kategori || "Aset organisasi"}
        </span>
      </div>
    </div>
  );
}

export function Panel({
  eyebrow,
  title,
  right,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl bg-card p-5 ring-1 ring-border ${className}`}>
      {(eyebrow || title) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {eyebrow && (
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {eyebrow}
              </div>
            )}
            {title && <h2 className="mt-1 text-[16px] font-semibold">{title}</h2>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Btn({
  children,
  variant = "primary",
  className = "",
  ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const v =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:opacity-90"
      : "bg-surface text-foreground ring-1 ring-border hover:bg-secondary";
  return (
    <button
      {...p}
      className={`rounded-md px-3 py-2 text-[13px] font-medium transition disabled:opacity-40 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

export function WalletButton() {
  const { wallet, connect, disconnect } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setBusy(true);
    setError(null);
    try {
      if (wallet) {
        await disconnect();
        toast.success("Wallet terputus");
      } else {
        await connect();
        toast.success("Wallet terhubung", { description: "Sesi Phantom aktif · Solana Devnet." });
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Gagal menghubungkan Phantom.";
      setError(message);
      toast.error("Wallet gagal terhubung", { description: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {wallet ? (
        <Btn variant="ghost" onClick={handleClick} disabled={busy} title="Putuskan Wallet">
          <span className="text-primary">● </span>
          {shortWallet(wallet)}
        </Btn>
      ) : (
        <Btn onClick={handleClick} disabled={busy}>
          {busy ? "Menghubungkan..." : "Hubungkan Phantom"}
        </Btn>
      )}
      {error && (
        <span role="alert" className="max-w-56 text-right text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}

export const inputCls =
  "w-full rounded-md bg-background px-3 py-2 text-[13px] ring-1 ring-border outline-none focus:ring-primary";

const nav = [
  { to: "/admin", label: "Dasbor Admin", short: "Admin" },
  { to: "/peminjam", label: "Dasbor Peminjam", short: "Peminjam" },
  { to: "/auditor", label: "Log Audit", short: "Audit" },
  { to: "/bukti", label: "Bukti Data", short: "Bukti" },
  { to: "/aset/$id", params: { id: "AST-001" }, label: "Verifikasi Aset", short: "Verifikasi" },
] as const;

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { wallet } = useStore();
  const linkCls =
    "block whitespace-nowrap rounded-md px-2.5 py-2 text-[12px] text-muted-foreground transition hover:bg-surface hover:text-foreground sm:px-3 sm:text-[13px]";
  const active = { className: "bg-primary/15 !text-primary ring-1 ring-primary/25 font-medium" };
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-border bg-card/60 px-5 py-6 lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/30">
            <span className="size-2 rounded-full bg-primary" />
          </span>
          <div>
            <div className="font-display text-[15px] font-semibold leading-none">Asset Borrow</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Sistem Peminjaman
            </div>
          </div>
        </Link>
        <nav className="mt-8 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              {...("params" in n ? { params: n.params } : {})}
              className={linkCls}
              activeProps={active}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-lg bg-surface p-3 ring-1 ring-border">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Wallet
          </div>
          <div className="mt-1 text-[12px] text-primary">
            {wallet ? shortWallet(wallet) : "Belum terhubung"}
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="font-display font-semibold">
              Asset Borrow
            </Link>
            <WalletButton />
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {nav.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                {...("params" in n ? { params: n.params } : {})}
                className={linkCls}
                activeProps={active}
              >
                <span className="sm:hidden">{n.short}</span>
                <span className="hidden sm:inline">{n.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-semibold leading-none">{title}</h1>
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/25">
                Solana Devnet
              </span>
            </div>
            <div className="hidden lg:block">
              <WalletButton />
            </div>
          </div>
          <SimBanner />
          {children}
        </main>
      </div>
    </div>
  );
}

export function BarChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const total = values.reduce((sum, v) => sum + v, 0);
  const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  return (
    <div>
      <div
        className="flex h-[160px] items-end gap-2 border-b border-border pb-px pt-6"
        role="img"
        aria-label={`Grafik peminjaman tujuh hari terakhir, total ${total} peminjaman`}
      >
        {values.map((v, i) => (
          <div
            key={i}
            className="flex h-full w-full items-end justify-center"
            aria-label={`${days[i] ?? ""}: ${v} peminjaman`}
          >
            <div
              className="relative w-full rounded-t bg-gradient-to-t from-primary/35 to-primary/85 transition hover:from-primary/50 hover:to-primary"
              style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
              title={`${days[i] ?? ""}: ${v} peminjaman`}
            >
              <span className="absolute inset-x-0 -top-5 text-center text-[10px] font-semibold tabular-nums text-foreground">
                {v}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 text-[10px] text-muted-foreground">
        {days.map((d) => (
          <span key={d} className="w-full text-center">
            {d}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span>Total 7 hari</span>
        <span className="font-medium text-foreground">{total} peminjaman</span>
      </div>
    </div>
  );
}
