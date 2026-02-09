import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export default async function middleware(request: NextRequest) {
  const currentRoute = request.nextUrl.pathname.split("/")[1];
  if (currentRoute === "en" || currentRoute === "fa") {
    const pathWithoutLocale = request.nextUrl.pathname.replace(
      `/${currentRoute}`,
      "",
    );
    const response = CustomResponse.redirect(
      new URL(pathWithoutLocale ? pathWithoutLocale : "/", request.url),
      request,
    );
    response.cookies.set("NEXT_LOCALE", currentRoute, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10),
    });
    return response;
  }

  // Check for shops that's are like this: /cvexor/0f7d0b72-fac4-4c52-a9af-0a0607bee542/order
  const splittedPathname = request.nextUrl.pathname.split("/");
  splittedPathname.shift();

  if (splittedPathname.length === 3 && splittedPathname.at(-1) === "order") {
    if (UUID_REGEX.test(splittedPathname[1])) {
      return CustomResponse.next(request);
    }
  }

  if (request.nextUrl.pathname.startsWith("/auth")) {
    return authMiddleware(request);
  }

  return consoleMiddleware(request);
}

// Console Middleware
async function consoleMiddleware(request: NextRequest) {
  const token = request.cookies.get("token");

  // Allow access to /support path without authentication
  if (request.nextUrl.pathname === "/support") {
    return CustomResponse.next(request);
  }

  if (!token) {
    return CustomResponse.redirect(new URL("/auth", request.url), request);
  }

  return CustomResponse.next(request);
}

// Auth Middleware
async function authMiddleware(request: NextRequest) {
  const token = request.cookies.get("token");

  if (!token) {
    if (request.nextUrl.pathname === "/auth/onboarding") {
      return CustomResponse.redirect(new URL("/auth", request.url), request);
    }
    return CustomResponse.next(request);
  }

  if (request.nextUrl.pathname === "/auth/onboarding") {
    return CustomResponse.next(request);
  }

  return CustomResponse.redirect(new URL("/", request.url), request);
}

// Custom Response
export class CustomResponse {
  static redirect(
    url: string | URL,
    request: NextRequest,
    init?: number | RequestInit,
  ) {
    const response = NextResponse.redirect(url, init);
    response.headers.set("next-pathname", request.nextUrl.pathname);
    return response;
  }

  static next(request: NextRequest, init?: any | URL) {
    const response = NextResponse.next(init);
    response.headers.set("next-pathname", request.nextUrl.pathname);
    return response;
  }
}

// Config
export const config = {
  matcher: [
    "/((?!api|payments/verify|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|fonts).*)",
  ],
};
