import type { APIRoute } from "astro";
import { getObjectR2 } from "@/lib/r2";

const MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
};

export const GET: APIRoute = async ({ params }) => {
  const path = params.path ?? "";
  const obj = await getObjectR2(`icons/${path}`);
  if (!obj) {
    return new Response("Not Found", { status: 404 });
  }

  const ext = "." + path.split(".").pop()?.toLowerCase();
  const ct = MIME[ext] || obj.contentType;

  const buf = new Uint8Array(await new Response(obj.body).arrayBuffer());

  return new Response(buf, {
    headers: {
      "Content-Type": ct,
      "Content-Length": String(buf.byteLength),
      "Cache-Control": obj.cacheControl,
    },
  });
};
