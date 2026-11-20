import { ok } from "@/lib/api-response";
import { deleteInstitution, updateInstitution } from "@/lib/queries";
import { forbidden, notAuthenticated, queryError, requireAdmin, requireUser } from "@/lib/route-auth";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return ok(await updateInstitution(Number(id), body));
  } catch (error) {
    return queryError(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  if (!(await requireAdmin(request))) return forbidden();
  try {
    const { id } = await params;
    return ok(await deleteInstitution(Number(id)));
  } catch (error) {
    return queryError(error);
  }
}
