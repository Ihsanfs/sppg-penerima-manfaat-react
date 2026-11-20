import { ok, serverError } from "@/lib/api-response";
import { getProfile, updateProfile } from "@/lib/queries";
import { forbidden, notAuthenticated, queryError, requireAdmin, requireUser } from "@/lib/route-auth";

export async function GET(request: Request) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    return ok({ profile: await getProfile() });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  if (!(await requireAdmin(request))) return forbidden();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return ok({ profile: await updateProfile(body) });
  } catch (error) {
    return queryError(error);
  }
}
