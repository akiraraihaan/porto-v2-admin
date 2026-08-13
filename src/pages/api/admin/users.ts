import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { getAuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/http";

export const GET: APIRoute = async ({ cookies }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }
  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  return json(users);
};

export const POST: APIRoute = async ({ cookies, request }) => {
  if (!getAuthUser(cookies)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await request.json();
  const email = String(body.email ?? "").toLowerCase().trim();
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return json({ error: "Email dan password wajib diisi" }, 400);
  }

  const exists = await prisma.adminUser.findUnique({ where: { email } });
  if (exists) {
    return json({ error: "Email sudah terdaftar" }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({
    data: { email, name: name || null, passwordHash },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return json(user, 201);
};
