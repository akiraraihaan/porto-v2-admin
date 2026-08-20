import type { APIRoute } from "astro";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/http";
import { checkCsrfOrigin } from "@/lib/sanitize";

const ADMIN_API = [
  import.meta.env.SITE_URL,
  "https://admin.akiraa.site",
  "http://localhost:4322",
].filter(Boolean) as string[];

export const GET: APIRoute = async ({ cookies }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }
  const rows = await prisma.siteSetting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return json(map);
};

export const PUT: APIRoute = async ({ cookies, request }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (!checkCsrfOrigin(request, ADMIN_API)) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const { key, value } = await request.json();
    if (!key || typeof key !== "string") {
      return json({ error: "Key is required" }, 400);
    }

    let parsedValue: Prisma.InputJsonValue = value as Prisma.InputJsonValue;
    if (typeof value === "string") {
      try {
        parsedValue = JSON.parse(value) as Prisma.InputJsonValue;
      } catch {
        parsedValue = value as Prisma.InputJsonValue;
      }
    }

    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: parsedValue },
      update: { value: parsedValue },
    });

    return json({ ok: true });
  } catch (e) {
    console.error("[settings:update] ERROR:", e);
    return json({ error: "Save failed" }, 400);
  }
};

export const DELETE: APIRoute = async ({ cookies, url, request }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (!checkCsrfOrigin(request, ADMIN_API)) {
    return json({ error: "Forbidden" }, 403);
  }

  const key = url.searchParams.get("key");
  if (!key) {
    return json({ error: "Key is required" }, 400);
  }

  try {
    await prisma.siteSetting.delete({ where: { key } });
    return json({ ok: true });
  } catch (e) {
    console.error("[settings:delete] ERROR:", e);
    return json({ error: "Delete failed" }, 400);
  }
};
