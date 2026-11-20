import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { AuthUser } from "@/lib/types";

export const TOKEN_COOKIE = "sppg_token";
const JWT_SECRET =
  process.env.JWT_SECRET || "sppg-dev-secret-ganti-di-produksi";

export type { AuthUser } from "@/lib/types";

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string | undefined | null): AuthUser | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === "string") return null;
    return {
      id: Number(payload.id),
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: payload.role ? String(payload.role) : null,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(TOKEN_COOKIE)?.value);
}

export function userFromBearer(header: string | null): AuthUser | null {
  if (!header?.startsWith("Bearer ")) return null;
  return verifyToken(header.slice(7));
}
