import { ok, serverError } from "@/lib/api-response";
import { getGis } from "@/lib/queries";
import { notAuthenticated, requireUser } from "@/lib/route-auth";

export async function GET(request: Request) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    return ok(await getGis());
  } catch (error) {
    return serverError(error);
  }
}
