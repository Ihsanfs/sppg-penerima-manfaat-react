import { ok } from "@/lib/api-response";
import { deleteUser, updateUser } from "@/lib/queries";
import { forbidden, notAuthenticated, queryError, requireAdmin } from "@/lib/route-auth";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const admin = await requireAdmin(request);
  if (!admin) return forbidden();
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return ok(await updateUser(Number(id), body));
  } catch (error) {
    return queryError(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const admin = await requireAdmin(request);
  if (!admin) return forbidden();
  try {
    const { id } = await params;
    return ok(await deleteUser(Number(id), admin.id));
  } catch (error) {
    return queryError(error);
  }
}
