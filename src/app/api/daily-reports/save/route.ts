import { ok } from "@/lib/api-response";
import { saveDailyReport } from "@/lib/queries";
import { notAuthenticated, queryError, requireUser } from "@/lib/route-auth";

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return notAuthenticated();
  try {
    const body = (await request.json().catch(() => ({}))) as {
      tanggal?: string;
      sumber?: string;
      catatan?: string;
    };
    return ok(await saveDailyReport(body, user));
  } catch (error) {
    return queryError(error);
  }
}
