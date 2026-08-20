import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, buildSessionCookieOptions } from "@/lib/session";
import { json } from "@/lib/http";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const POST: APIRoute = async ({ request, cookies }) => {
  const ip = getClientIp(request);
  const rl = rateLimit(`login:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return json({ error: "Too many login attempts. Try again later." }, 429);
  }

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
    return json({ error: "An error occurred during login" }, 500);
  }
};
