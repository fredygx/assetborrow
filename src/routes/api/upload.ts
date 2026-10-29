import { createFileRoute } from "@tanstack/react-router";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/server/storage.server";

const MAX_BYTES = 1_500_000;
const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const file = form.get("file");
          if (!file || typeof file === "string") {
            return Response.json({ error: "File gambar tidak ditemukan." }, { status: 400 });
          }
          const extension = EXTENSIONS[file.type];
          if (!extension) {
            return Response.json(
              { error: "Format gambar harus PNG, JPG, WEBP, GIF, atau AVIF." },
              { status: 400 },
            );
          }
          if (file.size > MAX_BYTES) {
            return Response.json({ error: "Ukuran foto maksimal 1,5 MB." }, { status: 400 });
          }

          const buffer = Buffer.from(await file.arrayBuffer());
          const hash = createHash("sha256").update(buffer).digest("hex");
          const fileName = `${Date.now()}-${hash.slice(0, 12)}-${randomBytes(3).toString("hex")}.${extension}`;
          await mkdir(UPLOAD_DIR, { recursive: true });
          await writeFile(path.join(UPLOAD_DIR, fileName), buffer);

          return Response.json({
            ok: true,
            url: `/api/uploads/${fileName}`,
            fileName,
            size: file.size,
            type: file.type,
            sha256: `sha256:${hash}`,
            folder: "data/uploads",
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Gagal menyimpan foto.";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
