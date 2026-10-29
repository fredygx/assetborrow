import { createFileRoute } from "@tanstack/react-router";
import { attachTransaction, parseTransaction } from "@/server/ledger.server";

export const Route = createFileRoute("/api/ledger-tx")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as unknown;
          if (!body || typeof body !== "object") {
            return Response.json({ error: "Body transaksi tidak valid." }, { status: 400 });
          }
          const payload = body as Record<string, unknown>;
          const recordId = payload["recordId"];
          if (typeof recordId !== "string") {
            return Response.json({ error: "Record ID wajib dikirim." }, { status: 400 });
          }
          const tx = parseTransaction(payload["tx"]);
          const result = await attachTransaction({ recordId, tx });
          return Response.json({ ok: true, ...result });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Gagal menyimpan transaksi.";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
