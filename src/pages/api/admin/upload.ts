import type { APIRoute } from "astro";
import { getAuthUser } from "@/lib/session";
import { json } from "@/lib/http";
import { isR2Configured, sanitizeKey, uploadToR2 } from "@/lib/r2";

const MAX_SIZE = 10 * 1024 * 1024;

export const POST: APIRoute = async ({ cookies, request }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!isR2Configured()) {
    return json({ error: "R2 is not configured" }, 500);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Body must be multipart/form-data" }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return json({ error: "Field 'file' is required" }, 400);
  }
  if (file.size === 0) {
    return json({ error: "File is empty" }, 400);
  }
  if (file.size > MAX_SIZE) {
    return json({ error: "File exceeds 10MB" }, 400);
  }

  const key = sanitizeKey(file.name);
  const buffer = new Uint8Array(await file.arrayBuffer());

  try {
    const url = await uploadToR2(key, buffer, file.type || "application/octet-stream");
    return json({ ok: true, url });
  } catch (e) {
    console.error("[upload] ERROR:", e);
    return json({ error: "Upload failed" }, 500);
  }
};
