import type { AuthUser } from "@/lib/types";

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "admin";
}

export function canDeleteData(user: AuthUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canManageUsers(user: AuthUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canChangeRole(user: AuthUser | null | undefined): boolean {
  return isAdmin(user);
}
