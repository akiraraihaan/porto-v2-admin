import type { APIRoute } from "astro";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";
import { json } from "@/lib/http";

export const GET: APIRoute = async ({ cookies }) => {
  const userId = verifySessionToken(cookies.get("admin_session")?.value);

  if (!userId) {
    return json({ user: null });
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return json({ user: null });
  }

  return json({ user });
};
