import { ok } from "@/lib/api-response";
import { getDailyReport } from "@/lib/queries";
import { notAuthenticated, queryError, requireUser } from "@/lib/route-auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    const { id } = await params;
    return ok(await getDailyReport(Number(id)));
  } catch (error) {
    return queryError(error);
  }
}
