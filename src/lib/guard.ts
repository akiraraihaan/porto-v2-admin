import type { AstroGlobal } from "astro";
import { verifySessionToken } from "./session";

export function requireAuth(Astro: AstroGlobal): Response | null {
  const userId = verifySessionToken(Astro.cookies.get("admin_session")?.value);
  if (!userId) {
    return Astro.redirect("/login");
  }
  return null;
}
