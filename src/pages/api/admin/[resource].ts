import type { APIRoute } from "astro";
import { getAuthUser } from "@/lib/session";
import { getDelegate, getOrderBy, sanitizeBody } from "@/lib/crud";
import { getResourceSpec } from "@/lib/specs";
import { json } from "@/lib/http";
import { getObjectDataUri } from "@/lib/r2";

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

  const resource = params.resource!;
  const delegate = getDelegate(resource);
  const spec = getResourceSpec(resource);
  if (!delegate || !spec || spec.creatable === false) {
    return json({ error: "Cannot create resource" }, 400);
  }

  const body = await request.json();
  const data = sanitizeBody(body, spec);

  try {
    const row = await delegate.create({ data });
    return json(row, 201);
  } catch (e: unknown) {
    return json(
      { error: e instanceof Error ? e.message : "Create failed" },
      400
    );
  }
};
