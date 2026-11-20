import { fail, ok } from "@/lib/api-response";
import { importBeneficiaries, importInstitutions } from "@/lib/import-export";
import { forbidden, queryError, requireAdmin } from "@/lib/route-auth";

export async function POST(request: Request) {
  const user = await requireAdmin(request);
  if (!user) return forbidden();

  try {
    const form = await request.formData();
    const file = form.get("file");
    const type = String(form.get("type") ?? "beneficiaries");

    if (!(file instanceof File)) return fail("File tidak ditemukan.", 422);
    if (file.size > 10 * 1024 * 1024) return fail("Ukuran file maksimal 10 MB.", 422);

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(extension ?? "")) {
      return fail("Format file harus .xlsx, .xls, atau .csv.", 422);
    }

    const result =
      type === "institutions"
        ? await importInstitutions(file)
        : await importBeneficiaries(file, user);
    return ok(result);
  } catch (error) {
    return queryError(error);
  }
}
