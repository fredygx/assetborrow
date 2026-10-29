import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/server/storage.server";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export const Route = createFileRoute("/api/uploads/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const file = params.file;
        if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(file) || file.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        try {
          const data = await readFile(path.join(UPLOAD_DIR, file));
          const type = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
          return new Response(new Uint8Array(data), {
            headers: {
              "content-type": type,
              "cache-control": "public, max-age=31536000, immutable",
            },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
