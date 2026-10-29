import { createFileRoute } from "@tanstack/react-router";
import { readLedger, writeLedger } from "@/server/ledger.server";

export const Route = createFileRoute("/api/ledger")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ledger = await readLedger();
        const url = new URL(request.url);
        const download = url.searchParams.get("download") === "1";
        return new Response(`${JSON.stringify(ledger, null, 2)}\n`, {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            ...(download ? { "content-disposition": 'attachment; filename="ledger.json"' } : {}),
          },
        });
      },
      PUT: async ({ request }) => {
        try {
          const body = (await request.json()) as unknown;
          if (!body || typeof body !== "object") {
            return Response.json({ error: "Body ledger tidak valid." }, { status: 400 });
          }
          const ledger = body as Parameters<typeof writeLedger>[0];
          if (
            !Array.isArray(ledger.assets) ||
            !Array.isArray(ledger.requests) ||
            !Array.isArray(ledger.records)
          ) {
            return Response.json({ error: "Struktur ledger tidak lengkap." }, { status: 400 });
          }
          await writeLedger(ledger);
          return Response.json({ ok: true, path: "data/ledger.json", ledger });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Gagal menyimpan ledger.";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
