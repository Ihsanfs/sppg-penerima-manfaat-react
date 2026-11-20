import { fail, serverError } from "@/lib/api-response";
import { getCurrentUser, userFromBearer, type AuthUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { NotFoundError, ValidationError } from "@/lib/queries";

export async function requireUser(request: Request): Promise<AuthUser | null> {
  return (await getCurrentUser()) ?? userFromBearer(request.headers.get("authorization"));
}

export async function requireAdmin(request: Request): Promise<AuthUser | null> {
  const user = await requireUser(request);
  return isAdmin(user) ? user : null;
}

export function queryError(error: unknown) {
  if (error instanceof ValidationError) return fail(error.message, 422);
  if (error instanceof NotFoundError) return fail(error.message, 404);
  return serverError(error);
}

export function notAuthenticated() {
  return fail("Belum login. Silakan masuk ke area admin.", 401);
}

export function forbidden() {
  return fail("Aksi ini hanya tersedia untuk pengguna dengan role admin.", 403);
}
