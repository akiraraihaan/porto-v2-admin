import type { APIRoute } from "astro";
import { getObjectR2 } from "@/lib/r2";

export const GET: APIRoute = async ({ params }) => {
  const path = params.path ?? "";
  const obj = await getObjectR2(`uploads/${path}`);
  if (!obj) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.contentType,
      "Cache-Control": obj.cacheControl,
    },
  });
};