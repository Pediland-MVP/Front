import { NextResponse } from "next/server";
import type { MiddlewareConfig, NextRequest } from "next/server";
import * as jose from "jose";

import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();

async function middleware(request: NextRequest) {
  const token = request.cookies.get("token");

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isConsolePage = request.nextUrl.pathname.startsWith('/console')
  if (isAuthPage && !token) {
    const isVerifyPage = request.nextUrl.pathname === '/auth/verify'
    if (isVerifyPage) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
    return NextResponse.next()
  }

  if (isConsolePage && !token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const jwt = await jose.jwtVerify(token!.value, secret);

    if (isConsolePage) {
      return consoleMiddleWare(request, jwt);
    }

    if (isAuthPage) {
      return authMiddleware(request, jwt);
    }
    return NextResponse.next();
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }
}

async function consoleMiddleWare(
  request: NextRequest,
  jwt: jose.JWTVerifyResult<any>
) {
  if (!jwt) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  if (!jwt.payload.isVerified) {
    return NextResponse.redirect(
      new URL("/auth/verify?fromSignIn=true", request.url)
    );
  }
  return NextResponse.next();
}

async function authMiddleware(
  request: NextRequest,
  jwt: jose.JWTVerifyResult<any>
) {
  if (jwt.payload.isVerified) {
    return NextResponse.redirect(new URL("/console", request.url));
  }
  return NextResponse.next();
}


export default withNextIntl(middleware);

export const config: MiddlewareConfig = {
  matcher: ["/console/:path*", "/auth/:path*"],
};
