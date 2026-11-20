import { fail, ok, serverError } from "@/lib/api-response";
import { signToken, TOKEN_COOKIE } from "@/lib/auth";
import { one } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };
    const email = String(body.email ?? "");
    const password = String(body.password ?? "");

    const user = await one<{ id: number; name: string; email: string; password: string }>(
      "SELECT id, name, email, password FROM users WHERE lower(email) = lower($1) LIMIT 1",
      [email],
    );

    // Hash Laravel ($2y$) perlu disesuaikan ke format bcrypt standar ($2a$).
    const hash = user?.password?.startsWith("$2y$")
      ? `$2a$${user.password.slice(4)}`
      : user?.password;

    if (!user || !hash) return fail("Email atau password salah.", 401);

    const bcrypt = (await import("bcryptjs")).default;
    if (!bcrypt.compareSync(password, hash)) {
      return fail("Email atau password salah.", 401);
    }

    const roleRow = await one<{ name: string }>(
      `SELECT r.name FROM model_has_roles mr
       JOIN roles r ON r.id = mr.role_id
       WHERE mr.model_id = $1 AND mr.model_type = 'App\\Models\\User'
       ORDER BY r.name LIMIT 1`,
      [user.id],
    );

    const payload = {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      role: roleRow?.name ?? "petugas",
    };
    const token = signToken(payload);
    const response = ok({ token, user: payload });
    response.cookies.set(TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    return serverError(error);
  }
}
