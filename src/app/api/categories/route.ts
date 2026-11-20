import { ok, serverError } from "@/lib/api-response";
import { createCategory, listCategories } from "@/lib/queries";
import { notAuthenticated, queryError, requireUser } from "@/lib/route-auth";

export async function GET(request: Request) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    return ok({ data: await listCategories() });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return ok(await createCategory(body), 201);
  } catch (error) {
    return queryError(error);
  }
}
