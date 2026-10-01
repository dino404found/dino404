import { getChatGPTUser } from "@/app/chatgpt-auth";
import { runtimeKind } from "@/lib/runtime";
export const dynamic = "force-dynamic";
export async function GET() {
  if (runtimeKind !== "netlify") return new Response("Not found", { status: 404 });
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (!process.env.ADMIN_PASSWORD_SHA256) return new Response("DINO404 owner access has not been configured.", { status: 503, headers });
  if (await getChatGPTUser()) return new Response(null, { status: 303, headers: { ...headers, Location: "/admin" } });
  return new Response("DINO404 owner sign-in required.", { status: 401, headers: { ...headers, "WWW-Authenticate": 'Basic realm="DINO404 owner", charset="UTF-8"' } });
}
