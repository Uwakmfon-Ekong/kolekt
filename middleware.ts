import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast first gate: no session cookie means no organiser pages. The (app) and (flow)
 * layouts then check the session against the database, so a stale or forged cookie
 * still ends up at /login.
 */
const PROTECTED = ["/dashboard", "/collections", "/reports", "/profile"];
const AUTH_PAGES = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("kolekt_session")?.value);

  if (!hasSession && PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  if (hasSession && AUTH_PAGES.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/collections/:path*", "/reports/:path*", "/profile/:path*", "/login", "/signup"],
};
