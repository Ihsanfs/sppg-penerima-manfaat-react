import { ok, serverError } from "@/lib/api-response";
import { listDailyReports } from "@/lib/queries";
import { notAuthenticated, requireUser } from "@/lib/route-auth";

export async function GET(request: Request) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    const url = new URL(request.url);
    return ok(
      await listDailyReports(
        Number(url.searchParams.get("page")) || 1,
        Number(url.searchParams.get("limit")) || 20,
      ),
    );
  } catch (error) {
    return serverError(error);
  }
}
