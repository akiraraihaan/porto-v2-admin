import type { APIRoute } from "astro";
import { getAuthUser } from "@/lib/session";
import { getDelegate } from "@/lib/crud";
import { getResourceSpec } from "@/lib/specs";
import { json } from "@/lib/http";

export const PATCH: APIRoute = async ({ cookies, params, request }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const resource = params.resource!;
  const delegate = getDelegate(resource);
  const spec = getResourceSpec(resource);
  if (!delegate || !spec) {
    return json({ error: "Unknown resource" }, 404);
  }
  if (!spec.columns.includes("order")) {
    return json({ error: "Resource is not sortable" }, 400);
  }

  const body = (await request.json()) as { ids?: unknown };
  const rawIds = Array.isArray(body?.ids) ? body.ids : [];
  const ids = rawIds.map((x: unknown) => String(x)).filter(Boolean);
  if (ids.length === 0) {
    return json({ error: "No ids provided" }, 400);
  }

  try {
    for (let i = 0; i < ids.length; i++) {
      await delegate.update({ where: { id: ids[i] }, data: { order: i } });
    }
    return json({ ok: true });
  } catch (e: unknown) {
    return json(
      { error: e instanceof Error ? e.message : "Reorder failed" },
      400
    );
  }
};