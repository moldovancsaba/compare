import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, isSupportedLocale, localeCookieName } from "@/lib/i18n/config";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const segments = pathname.split("/").filter(Boolean);
  const requestedLocale = segments[0];
  const hasLocalePrefix = isSupportedLocale(requestedLocale);

  if (hasLocalePrefix) {
    const response = NextResponse.next();
    response.cookies.set(localeCookieName, requestedLocale, { path: "/", maxAge: 31536000 });
    return response;
  }

  if (pathname === "/" || !requestedLocale) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    const response = NextResponse.redirect(nextUrl);
    response.cookies.set(localeCookieName, DEFAULT_LOCALE, { path: "/", maxAge: 31536000 });
    return response;
  }

  const nextUrl = request.nextUrl.clone();
  const stripped = pathname.replace(/^\/[^/]+/, "");
  nextUrl.pathname = `/${DEFAULT_LOCALE}${stripped}`;
  const response = NextResponse.redirect(nextUrl);
  response.cookies.set(localeCookieName, DEFAULT_LOCALE, { path: "/", maxAge: 31536000 });

  return response;
}

export const config = {
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
