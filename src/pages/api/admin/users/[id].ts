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

  if (id !== currentUserId) {
    return json({ error: "You can only edit your own account" }, 403);
  }

  try {
    const body = await request.json();
    const data: { email?: string; name?: string | null; passwordHash?: string } = {};

    if (typeof body.email === "string" && body.email.trim()) {
      data.email = body.email.toLowerCase().trim();
    }
    if (typeof body.name === "string") {
      data.name = body.name.trim() || null;
    }
    if (typeof body.password === "string" && body.password) {
      if (body.password.length < 8) {
        return json({ error: "Password must be at least 8 characters" }, 400);
      }
      data.passwordHash = await bcrypt.hash(body.password, 10);
    }

    if (Object.keys(data).length === 0) {
      return json({ error: "Nothing to update" }, 400);
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return json(user);
  } catch (e) {
    console.error("[users:update] ERROR:", e);
    return json({ error: "Update failed" }, 400);
  }
};

export const DELETE: APIRoute = async ({ cookies, params }) => {
  const currentUserId = getAuthUser(cookies);
  if (!currentUserId) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { id } = params;
  if (id !== currentUserId) {
    return json({ error: "You can only delete your own account" }, 403);
  }

  try {
    await prisma.adminUser.delete({ where: { id } });
    return json({ ok: true });
  } catch (e) {
    console.error("[users:delete] ERROR:", e);
    return json({ error: "Delete failed" }, 400);
  }
};
