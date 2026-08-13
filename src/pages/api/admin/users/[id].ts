import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { getAuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/http";

export const PUT: APIRoute = async ({ cookies, params, request }) => {
  const currentUserId = getAuthUser(cookies);
  if (!currentUserId) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { id } = params;
  const body = await request.json();

  const data: { email?: string; name?: string | null; passwordHash?: string } = {};

  if (typeof body.email === "string" && body.email.trim()) {
    data.email = body.email.toLowerCase().trim();
  }
  if (typeof body.name === "string") {
    data.name = body.name.trim() || null;
  }
  if (typeof body.password === "string" && body.password) {
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }

  if (Object.keys(data).length === 0) {
    return json({ error: "Nothing to update" }, 400);
  }

  try {
    const user = await prisma.adminUser.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return json(user);
  } catch (e: unknown) {
    return json(
      { error: e instanceof Error ? e.message : "Update failed" },
      400
    );
  }
};

export const DELETE: APIRoute = async ({ cookies, params }) => {
  const currentUserId = getAuthUser(cookies);
  if (!currentUserId) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { id } = params;
  if (id === currentUserId) {
    return json({ error: "Cannot delete your own account" }, 400);
  }

  await prisma.adminUser.delete({ where: { id } });
  return json({ ok: true });
};
