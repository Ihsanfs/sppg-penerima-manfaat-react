import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Terjadi kesalahan server.";
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  if (code === "23503") return fail("Data masih digunakan oleh data lain.", 400);
  if (code === "23505") return fail("Data sudah ada (duplikat).", 400);
  if (code === "23514") return fail("Nilai tidak sesuai format yang diizinkan database.", 400);

  console.error("[api]", error);
  return fail(message, 500);
}

export function requireAuthError() {
  return fail("Belum login. Silakan masuk ke area admin.", 401);
}
