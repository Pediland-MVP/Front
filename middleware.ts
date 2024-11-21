import { NextResponse } from "next/server";
import type { MiddlewareConfig, NextRequest } from "next/server";
import * as jose from "jose";

import createNextIntlPlugin from "next-intl/plugin";
import { redirect } from "next/navigation";

const withNextIntl = createNextIntlPlugin();

export default async function middleware(request: NextRequest) {
  const currentRoute = request.nextUrl.pathname.split("/")[1];
  if (currentRoute === "en" || currentRoute === "fa") {
    const pathWithoutLocale = request.nextUrl.pathname.replace(
      `/${currentRoute}`,
      ""
    );
    const response = CustomResponse.redirect(
      new URL(pathWithoutLocale, request.url),
      request
    )
    response.cookies.set("NEXT_LOCALE", currentRoute)
    return response
  }

  if (request.nextUrl.pathname.startsWith("/auth")) {
    return authMiddleware(request);
  }

  if (request.nextUrl.pathname.startsWith("/console")) {
    return consoleMiddleware(request);
  }

  return CustomResponse.next(request);

  // const headerWithPathname = new Headers(request.headers);
  // headerWithPathname.set('next-pathname', request.nextUrl.pathname)
  // const token = request.cookies.get("token");

  // const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  // const isConsolePage = request.nextUrl.pathname.startsWith('/console')
  // if (isAuthPage && !token) {
  //   const isVerifyPage = request.nextUrl.pathname === '/auth/verify'
  //   if (isVerifyPage) {
  //     return NextResponse.redirect(new URL("/auth/signin", request.url));
  //   }
  //   return NextResponse.next({
  //     headers: headerWithPathname
  //   })
  // }

  // if (isConsolePage && !token) {
  //   return NextResponse.redirect(new URL("/auth/signin", request.url));
  // }

  // try {
  //   const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  //   const jwt = await jose.jwtVerify(token!.value, secret);

  //   if (isConsolePage) {
  //     return consoleMiddleWare(request, jwt, headerWithPathname);
  //   }

  //   if (isAuthPage) {
  //     return authMiddleware(request, jwt, headerWithPathname);
  //   }
  //   return NextResponse.next({
  //     headers: headerWithPathname
  //   });
  // } catch (error) {
  //   console.error(error);
  //   return NextResponse.redirect(new URL("/auth/signin", request.url));
  // }
}

async function consoleMiddleware(request: NextRequest) {
  const token = request.cookies.get("token2");
  if (!token) {
    return CustomResponse.redirect(
      new URL("/auth/signin", request.url),
      request
    );
  }

  const jwt = await parseJwt(token.value, request);

  if (!jwt) {
    return CustomResponse.redirect(
      new URL("/auth/signin", request.url),
      request
    );
  }

  if (!jwt.payload.isVerified) {
    return CustomResponse.redirect(
      new URL("/auth/verify?fromSignIn=true", request.url),
      request
    );
  }
  return CustomResponse.next(request);
}

async function authMiddleware(request: NextRequest) {
  const token = request.cookies.get("token");
  if (!token) {
    const isVerifyPage = request.nextUrl.pathname === "/auth/verify";
    if (isVerifyPage) {
      return CustomResponse.redirect(
        new URL("/auth/signin", request.url),
        request
      );
    }
    return CustomResponse.next(request);
  }

  const jwt = await parseJwt(token.value, request);

  if (!jwt) {
    return CustomResponse.next(request);
  }

  if (jwt.payload.isVerified) {
    return CustomResponse.redirect(new URL("/console", request.url), request);
  }
  return CustomResponse.next(request);
}

async function parseJwt(token: string, request: NextRequest) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const jwt = await jose.jwtVerify(token, secret);
    return jwt;
  } catch (error) {
    return false;
  }
}

export class CustomResponse {
  static redirect(
    url: string | URL,
    request: NextRequest,
    init?: number | RequestInit
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
