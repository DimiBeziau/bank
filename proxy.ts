import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/jwt";

const PUBLIC_PATHS = ["/login", "/signup"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = token ? await verifySessionToken(token) : null;

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!userId && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (userId && isPublicPath) {
    return NextResponse.redirect(new URL("/budget", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons|manifest.json|sw.js|favicon.ico).*)"],
};
