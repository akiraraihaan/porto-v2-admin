import type { APIRoute } from "astro";
import { getAuthUser } from "@/lib/session";
import { getDelegate, getOrderBy, sanitizeBody } from "@/lib/crud";
import { getResourceSpec } from "@/lib/specs";
import { json } from "@/lib/http";
import { getObjectDataUri } from "@/lib/r2";
import { checkCsrfOrigin } from "@/lib/sanitize";

const ADMIN_API = [
  import.meta.env.SITE_URL,
  "https://admin.akiraa.site",
  "http://localhost:4322",
].filter(Boolean) as string[];

export const GET: APIRoute = async ({ cookies, params }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const resource = params.resource!;
  const delegate = getDelegate(resource);
  if (!delegate) {
    return json({ error: "Unknown resource" }, 404);
  }

  const rows = await delegate.findMany({ orderBy: getOrderBy(resource) });

  if (resource === "skills") {
    const enriched = await Promise.all(
      rows.map(async (row) => {
        const r = row as Record<string, unknown>;
        if (typeof r.imgSrc === "string" && r.imgSrc.startsWith("/")) {
          const uri = await getObjectDataUri(r.imgSrc);
          if (uri) return { ...r, imgSrc: uri };
        }
        return r;
      })
    );
    return json(enriched);
  }

  return json(rows);
};

export const POST: APIRoute = async ({ cookies, params, request }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (!checkCsrfOrigin(request, ADMIN_API)) {
    return json({ error: "Forbidden" }, 403);
  }

  const resource = params.resource!;
  const delegate = getDelegate(resource);
  const spec = getResourceSpec(resource);
  if (!delegate || !spec || spec.creatable === false) {
    return json({ error: "Cannot create resource" }, 400);
  }

  try {
    const body = await request.json();
    const data = sanitizeBody(body, spec);
    const row = await delegate.create({ data });
    return json(row, 201);
  } catch (e) {
    console.error("[resource:create] ERROR:", e);
    return json({ error: "Create failed" }, 400);
  }
};
