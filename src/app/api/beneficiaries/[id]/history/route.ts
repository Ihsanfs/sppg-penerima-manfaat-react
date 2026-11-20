import { ok, serverError } from "@/lib/api-response";
import { getBeneficiaryHistory } from "@/lib/queries";
import { notAuthenticated, requireUser } from "@/lib/route-auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    const { id } = await params;
    return ok({ data: await getBeneficiaryHistory(Number(id)) });
  } catch (error) {
    return serverError(error);
  }
}
