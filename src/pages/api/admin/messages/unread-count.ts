import type { APIRoute } from "astro";
import { getAuthUser } from "@/lib/session";
import { json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const GET: APIRoute = async ({ cookies }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const count = await prisma.contactMessage.count({ where: { read: false } });
  return json({ count }, 200, { "Cache-Control": "private, max-age=10" });
};
