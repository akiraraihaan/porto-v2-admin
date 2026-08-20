import type { APIRoute } from "astro";
import { getAuthUser } from "@/lib/session";
import { getDelegate, sanitizeBody } from "@/lib/crud";
import { getResourceSpec } from "@/lib/specs";
import { json } from "@/lib/http";
import { checkCsrfOrigin } from "@/lib/sanitize";

const ADMIN_API = [
  import.meta.env.SITE_URL,
  "https://admin.akiraa.site",
  "http://localhost:4322",
].filter(Boolean) as string[];

export const PUT: APIRoute = async ({ cookies, params, request }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (!checkCsrfOrigin(request, ADMIN_API)) {
    return json({ error: "Forbidden" }, 403);
  }

  const { resource, id } = params;
  const delegate = getDelegate(resource!);
  const spec = getResourceSpec(resource!);
  if (!delegate || !spec) {
    return json({ error: "Unknown resource" }, 404);
  }

  try {
    const body = await request.json();
    const data = sanitizeBody(body, spec, true);

    if (Object.keys(data).length === 0) {
      return json({ error: "Nothing to update" }, 400);
    }

    const row = await delegate.update({ where: { id }, data });
    return json(row);
  } catch (e) {
    console.error("[resource:update] ERROR:", e);
    return json({ error: "Update failed" }, 400);
  }
};

export const DELETE: APIRoute = async ({ cookies, params, request }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (!checkCsrfOrigin(request, ADMIN_API)) {
    return json({ error: "Forbidden" }, 403);
  }

  const { resource, id } = params;
  const delegate = getDelegate(resource!);
  if (!delegate) {
    return json({ error: "Unknown resource" }, 404);
  }

  try {
    await delegate.delete({ where: { id } });
    return json({ ok: true });
  } catch (e) {
    console.error("[resource:delete] ERROR:", e);
    return json({ error: "Delete failed" }, 400);
  }
};
