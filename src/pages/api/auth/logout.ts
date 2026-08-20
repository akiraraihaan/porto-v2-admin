import type { APIRoute } from "astro";
import { buildSessionDeleteOptions } from "@/lib/session";
import { json } from "@/lib/http";

export const POST: APIRoute = async ({ request, cookies }) => {
  const secure = (request.headers.get("x-forwarded-proto") ?? "http") === "https";
  cookies.delete("admin_session", buildSessionDeleteOptions(secure));
  return json({ ok: true });
};
