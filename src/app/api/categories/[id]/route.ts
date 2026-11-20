import { ok } from "@/lib/api-response";
import { deleteCategory, updateCategory } from "@/lib/queries";
import { forbidden, notAuthenticated, queryError, requireAdmin, requireUser } from "@/lib/route-auth";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return ok(await updateCategory(Number(id), body));
  } catch (error) {
    return queryError(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  if (!(await requireAdmin(request))) return forbidden();
  try {
    const { id } = await params;
    return ok(await deleteCategory(Number(id)));
  } catch (error) {
    return queryError(error);
  }
}
