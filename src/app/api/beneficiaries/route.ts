import { ok, serverError } from "@/lib/api-response";
import { createBeneficiary, listBeneficiaries } from "@/lib/queries";
import { notAuthenticated, queryError, requireUser } from "@/lib/route-auth";

export async function GET(request: Request) {
  if (!(await requireUser(request))) return notAuthenticated();
  try {
    const url = new URL(request.url);
    return ok(
      await listBeneficiaries({
        q: url.searchParams.get("q") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        institutionId: url.searchParams.get("institution_id") ?? undefined,
        kategori: url.searchParams.get("kategori") ?? undefined,
        jenisKelamin: url.searchParams.get("jenis_kelamin") ?? undefined,
        page: Number(url.searchParams.get("page")) || 1,
        limit: Number(url.searchParams.get("limit")) || 20,
      }),
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return notAuthenticated();
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return ok(await createBeneficiary(body, user), 201);
  } catch (error) {
    return queryError(error);
  }
}
