import type { APIRoute } from "astro";
import { getAuthUser } from "@/lib/session";
import { json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const POST: APIRoute = async ({ cookies }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const result = await prisma.contactMessage.updateMany({
      where: { read: false },
      data: { read: true },
    });
    return json({ ok: true, count: result.count });
  } catch (e: unknown) {
    return json(
      { error: e instanceof Error ? e.message : "Failed" },
      500
    );
  }
};
