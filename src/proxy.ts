import { NextResponse, type NextRequest } from "next/server";

const publicPrefixes = ["/login", "/convite/", "/hub"];
const publicExact = ["/", "/login", "/selecionar-organizacao"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/") || publicExact.includes(pathname) || publicPrefixes.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();
  const authenticated = request.cookies.has("open_impact_session") || request.cookies.has("open_impact_account_session");
  if (!authenticated) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"] };
