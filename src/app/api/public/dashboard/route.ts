import { ok, serverError } from "@/lib/api-response";
import { getPublicDashboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await getPublicDashboard());
  } catch (error) {
    return serverError(error);
  }
}
