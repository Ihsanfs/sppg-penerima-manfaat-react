import { ok } from "@/lib/api-response";
import { deleteBeneficiary, updateBeneficiary } from "@/lib/queries";
import { forbidden, notAuthenticated, queryError, requireAdmin, requireUser } from "@/lib/route-auth";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  const user = await requireUser(request);
  if (!user) return notAuthenticated();
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return ok(await updateBeneficiary(Number(id), body, user));
  } catch (error) {
    return queryError(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const admin = await requireAdmin(request);
  if (!admin) return forbidden();
  try {
    const { id } = await params;
    return ok(await deleteBeneficiary(Number(id), admin));
  } catch (error) {
    return queryError(error);
  }
}
