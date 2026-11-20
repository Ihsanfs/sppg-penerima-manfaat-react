import { ok, serverError } from "@/lib/api-response";
import { createInstitution, listInstitutions } from "@/lib/queries";
import { notAuthenticated, queryError, requireUser } from "@/lib/route-auth";

export async function GET(request: Request) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    const url = new URL(request.url);
    return ok({
      data: await listInstitutions({
        q: url.searchParams.get("q") ?? undefined,
        tipe: url.searchParams.get("tipe") ?? undefined,
        jenjang: url.searchParams.get("jenjang") ?? undefined,
        isActive: url.searchParams.get("is_active") ?? undefined,
      }),
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return ok(await createInstitution(body), 201);
  } catch (error) {
    return queryError(error);
  }
}
