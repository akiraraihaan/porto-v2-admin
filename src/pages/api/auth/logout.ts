import type { APIRoute } from "astro";
import { json } from "@/lib/http";

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete("admin_session", { path: "/" });
  return json({ ok: true });
};
