import { ok } from "@/lib/api-response";
import { TOKEN_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = ok({ ok: true });
  response.cookies.set(TOKEN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
