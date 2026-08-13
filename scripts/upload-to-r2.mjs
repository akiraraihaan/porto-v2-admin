import "dotenv/config";
import { resolve } from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { extname, relative, join } from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error("Missing R2_* env vars");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
};

async function walk(dir, base, out) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(full, base, out);
    } else if (ent.isFile()) {
      out.push({ abs: full, key: relative(base, full).replace(/\\/g, "/") });
    }
  }
}

const srcArg = process.argv[2];
if (!srcArg) {
  console.error("Usage: node scripts/upload-to-r2.mjs <public-dir>");
  process.exit(1);
}

const base = resolve(srcArg);
const files = [];
await walk(base, base, files);

let uploaded = 0;
let failed = 0;

for (const f of files) {
  const body = await readFile(f.abs);
  const mime = MIME[extname(f.key).toLowerCase()] || "application/octet-stream";
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: f.key,
        Body: body,
        ContentType: mime,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    uploaded++;
    console.log(`UP   ${f.key} (${body.length} bytes)`);
  } catch (e) {
    failed++;
    console.error(`FAIL ${f.key}: ${e.message}`);
  }
}

console.log(`\nDONE files=${files.length} uploaded=${uploaded} failed=${failed}`);
