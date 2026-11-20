import { ok } from "@/lib/api-response";
import { createUser, listUsers } from "@/lib/queries";
import { forbidden, notAuthenticated, queryError, requireAdmin } from "@/lib/route-auth";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();
  try {
    return ok({ data: await listUsers() });
  } catch (error) {
    return queryError(error);
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return ok(await createUser(body), 201);
  } catch (error) {
    return queryError(error);
  }
}
