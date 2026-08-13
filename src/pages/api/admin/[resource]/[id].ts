import type { APIRoute } from "astro";
import { getAuthUser } from "@/lib/session";
import { getDelegate, sanitizeBody } from "@/lib/crud";
import { getResourceSpec } from "@/lib/specs";
import { json } from "@/lib/http";

export const PUT: APIRoute = async ({ cookies, params, request }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { resource, id } = params;
  const delegate = getDelegate(resource!);
  const spec = getResourceSpec(resource!);
  if (!delegate || !spec) {
    return json({ error: "Unknown resource" }, 404);
  }

  const body = await request.json();
  const data = sanitizeBody(body, spec, true);

  if (Object.keys(data).length === 0) {
    return json({ error: "Nothing to update" }, 400);
  }

  try {
    const row = await delegate.update({ where: { id }, data });
    return json(row);
  } catch (e: unknown) {
    return json(
      { error: e instanceof Error ? e.message : "Update failed" },
      400
    );
  }
};

export const DELETE: APIRoute = async ({ cookies, params }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { resource, id } = params;
  const delegate = getDelegate(resource!);
  if (!delegate) {
    return json({ error: "Unknown resource" }, 404);
  }

  try {
    await delegate.delete({ where: { id } });
    return json({ ok: true });
  } catch (e: unknown) {
    return json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      400
    );
  }
};
