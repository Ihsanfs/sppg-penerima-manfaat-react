import { ok, serverError } from "@/lib/api-response";
import { getBeneficiaryHistory } from "@/lib/queries";
import { notAuthenticated, requireUser } from "@/lib/route-auth";

export async function GET(request: Request) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    const raw = new URL(request.url).searchParams.get("beneficiary_id");
    const beneficiaryId = raw && /^\d+$/.test(raw) ? Number(raw) : undefined;
    return ok({ data: await getBeneficiaryHistory(beneficiaryId) });
  } catch (error) {
    return serverError(error);
  }
}
