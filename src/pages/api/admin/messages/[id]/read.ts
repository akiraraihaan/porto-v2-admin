import type { APIRoute } from "astro";
import { getAuthUser } from "@/lib/session";
import { json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const POST: APIRoute = async ({ cookies, params }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { id } = params;
  if (!id) return json({ error: "Missing id" }, 400);

  try {
    const row = await prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });
    return json(row);
  } catch (e) {
    console.error("[messages:read] ERROR:", e);
    return json({ error: "Failed" }, 500);
  }
};
