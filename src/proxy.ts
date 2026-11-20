import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "sppg_token";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
