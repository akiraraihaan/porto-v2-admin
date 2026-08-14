import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, buildSessionCookieOptions } from "@/lib/session";
import { json } from "@/lib/http";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return json({ error: "Email and password are required" }, 400);
    }

    const user = await prisma.adminUser.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
      return json({ error: "Invalid email or password" }, 401);
    }

    const secure = (request.headers.get("x-forwarded-proto") ?? "http") === "https";
    cookies.set("admin_session", createSessionToken(user.id), buildSessionCookieOptions(secure));

    return json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error("[login] ERROR:", e);
    return json({ error: e instanceof Error ? e.message : "An error occurred" }, 500);
  }
};
