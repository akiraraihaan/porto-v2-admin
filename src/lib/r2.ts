import "dotenv/config";
import { env } from "cloudflare:workers";
import { createHash, createHmac } from "node:crypto";

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

// S3-compatible access to the real bucket. Used in LOCAL DEV so uploads
// land in real R2 (shared with the visitor + production), instead of the
// per-project miniflare emulator. Production keeps using the R2 binding.
const s3Env = {
  accountId: () => (process.env.R2_ACCOUNT_ID ?? "").trim(),
  accessKey: () => (process.env.R2_ACCESS_KEY_ID ?? "").trim(),
  secretKey: () => (process.env.R2_SECRET_ACCESS_KEY ?? "").trim(),
  bucket: () => (process.env.R2_BUCKET ?? "porto-v2").trim(),
};

export function isS3Configured(): boolean {
  return Boolean(s3Env.accountId() && s3Env.accessKey() && s3Env.secretKey());
}

function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: string | Buffer, str: string): Buffer {
  return createHmac("sha256", key).update(str).digest();
}

async function s3Request(
  method: string,
  key: string,
  opts: { body?: Uint8Array; contentType?: string } = {}
): Promise<Response> {
  const host = `${s3Env.accountId()}.r2.cloudflarestorage.com`;
  const uri = `/${s3Env.bucket()}/${key}`;
  const region = "auto";
  const service = "s3";

  const date = new Date();
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const payload = opts.body ?? new Uint8Array(0);
  const payloadHash = sha256Hex(payload);

  const body: ArrayBuffer | undefined = opts.body
    ? (opts.body.buffer.slice(
        opts.body.byteOffset,
        opts.body.byteOffset + opts.body.byteLength
      ) as ArrayBuffer)
    : undefined;

  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (opts.contentType) headers["content-type"] = opts.contentType;

  const sortedNames = Object.keys(headers).sort();
  const canonicalHeaders = sortedNames.map((h) => `${h}:${headers[h]}\n`).join("");
  const signedHeaders = sortedNames.join(";");
  const canonicalRequest = `${method}\n${uri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256Hex(canonicalRequest)}`;

  const kDate = hmac("AWS4" + s3Env.secretKey(), dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  headers["authorization"] =
    `AWS4-HMAC-SHA256 Credential=${s3Env.accessKey()}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(`https://${host}${uri}`, {
    method,
    headers,
    body,
  });
}

async function r2PutS3(key: string, body: Uint8Array, contentType: string): Promise<void> {
  const res = await s3Request("PUT", key, { body, contentType });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

async function r2GetS3(key: string): Promise<R2Object | null> {
  const res = await s3Request("GET", key);
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 read failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return {
    body: res.body as ReadableStream,
    contentType: res.headers.get("content-type") ?? "application/octet-stream",
    cacheControl: res.headers.get("cache-control") ?? "public, max-age=31536000",
  };
}

export interface R2Object {
  body: ReadableStream;
  contentType: string;
  cacheControl: string;
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
  if (import.meta.env.DEV && isS3Configured()) {
    await r2PutS3(key, body, contentType);
  } else {
    await getBucket().put(key, body, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
  }
  return `/${key}`;
}

export async function getObjectR2(key: string): Promise<R2Object | null> {
  if (import.meta.env.DEV && isS3Configured()) {
    return await r2GetS3(key);
  }
  const obj = await getBucket().get(key);
  if (!obj) return null;
  return {
    body: obj.body,
    contentType: obj.httpMetadata?.contentType ?? "application/octet-stream",
    cacheControl: obj.httpMetadata?.cacheControl ?? "public, max-age=31536000",
  };
}