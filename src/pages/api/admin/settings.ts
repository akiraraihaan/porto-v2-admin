import type { APIRoute } from "astro";
import type { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/http";

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

  try {
    const { key, value } = await request.json();
    if (!key || typeof key !== "string") {
      return json({ error: "Key wajib diisi" }, 400);
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
  } catch (e: unknown) {
    return json(
      { error: e instanceof Error ? e.message : "Save failed" },
      400
    );
  }
};

export const DELETE: APIRoute = async ({ cookies, url }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const key = url.searchParams.get("key");
  if (!key) {
    return json({ error: "Key wajib diisi" }, 400);
  }

  await prisma.siteSetting.delete({ where: { key } });
  return json({ ok: true });
};
