import { ok } from "@/lib/api-response";
import { getWeeklyReport } from "@/lib/queries";
import { notAuthenticated, queryError, requireUser } from "@/lib/route-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    const tanggal = new URL(request.url).searchParams.get("tanggal") ?? undefined;
    return ok(await getWeeklyReport(tanggal));
  } catch (error) {
    return queryError(error);
  }
}
