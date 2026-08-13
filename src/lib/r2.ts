import "dotenv/config";
import { env } from "cloudflare:workers";

const publicBase = (process.env.PUBLIC_ASSET_BASE ?? "").replace(/\/$/, "");

const BINDING_NAME = process.env.R2_BINDING ?? "PORTO_V2";

function getBucket(): R2Bucket {
  const binding = (env as Record<string, R2Bucket>)[BINDING_NAME];
  if (!binding) throw new Error(`R2 binding '${BINDING_NAME}' tidak ditemukan`);
  return binding;
}

const ALLOWED_EXT = new Set([
  "svg", "png", "jpg", "jpeg", "gif", "webp", "ico", "avif",
]);

export function isR2Configured(): boolean {
  return Boolean((env as Record<string, R2Bucket>)[BINDING_NAME]);
}

export function sanitizeKey(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
  const safeExt = ALLOWED_EXT.has(ext) ? ext : "bin";
  const base = originalName
    .replace(/\.[^.]*$/, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `uploads/${stamp}-${base}.${safeExt}`;
}

export async function uploadToR2(
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<string> {
  await getBucket().put(key, body, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
  return `${publicBase}/${key}`;
}
