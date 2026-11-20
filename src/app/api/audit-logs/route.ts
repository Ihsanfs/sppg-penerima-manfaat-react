import { ok, serverError } from "@/lib/api-response";
import { getAuditLogs } from "@/lib/queries";
import { notAuthenticated, requireUser } from "@/lib/route-auth";

export async function GET(request: Request) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    return ok({ data: await getAuditLogs() });
  } catch (error) {
    return serverError(error);
  }
}
