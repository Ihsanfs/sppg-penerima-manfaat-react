import { ok } from "@/lib/api-response";
import { notAuthenticated, requireUser } from "@/lib/route-auth";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return notAuthenticated();
  return ok({ user });
}
