import { createFileRoute } from "@tanstack/react-router";
import { runLedgerAction } from "@/server/ledger.server";

export const Route = createFileRoute("/api/ledger-action")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as unknown;
          const result = await runLedgerAction(body);
          return Response.json({ ok: true, ...result });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Gagal menyimpan aksi.";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
