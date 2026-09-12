import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export default async function middleware(request: NextRequest) {
  const currentRoute = request.nextUrl.pathname.split('/')[1];
  if (currentRoute === 'en' || currentRoute === 'fa') {
    const pathWithoutLocale = request.nextUrl.pathname.replace(`/${currentRoute}`, '');
    const response = CustomResponse.redirect(
      new URL(pathWithoutLocale ? pathWithoutLocale : '/', request.url),
      request,
    );
    response.cookies.set('NEXT_LOCALE', currentRoute, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10),
    });
    return response;
  }

  // The legacy public shop checkout — /cvexor/0f7d0b72-fac4-4c52-a9af-0a0607bee542/order — was
  // RETIRED with the `(Shop)` route group; buying now happens inside the Instagram DM.
  //
  // This pass-through is deliberately KEPT rather than deleted. PRODUCT automation cards already
  // sent to buyers carry this URL in a template button, and per `MVP/CLAUDE.md` §11.5 those
  // buttons stay tappable forever. Letting the request through means an old tap renders the app's
  // 404 page. Removing this branch would instead drop it into `consoleMiddleware`, which sees no
  // `token` cookie and redirects the buyer to `/auth` — a login screen is a far worse answer than
  // "this page is gone".
  const splittedPathname = request.nextUrl.pathname.split('/');
  splittedPathname.shift();

  if (splittedPathname.length === 3 && splittedPathname.at(-1) === 'order') {
    if (UUID_REGEX.test(splittedPathname[1])) {
      return CustomResponse.next(request);
    }
  }

  if (request.nextUrl.pathname.startsWith('/auth')) {
    return authMiddleware(request);
  }

  return consoleMiddleware(request);
}

// Console Middleware
async function consoleMiddleware(request: NextRequest) {
  const token = request.cookies.get('token');

  // Allow access to /support path without authentication
  if (request.nextUrl.pathname === '/support') {
    return CustomResponse.next(request);
  }

  // Allow access to /learn path without authentication
  if (request.nextUrl.pathname === '/learn') {
    return CustomResponse.next(request);
  }

  if (!token) {
    return CustomResponse.redirect(new URL('/auth', request.url), request);
  }

  return CustomResponse.next(request);
}

// Auth Middleware
async function authMiddleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/auth/onboarding');

  if (!token) {
    if (isOnboardingRoute) {
      return CustomResponse.redirect(new URL('/auth', request.url), request);
    }
    return CustomResponse.next(request);
  }

  if (isOnboardingRoute) {
    return CustomResponse.next(request);
  }

  return CustomResponse.redirect(new URL('/', request.url), request);
}

// Custom Response
export class CustomResponse {
  static redirect(url: string | URL, request: NextRequest, init?: number | RequestInit) {
    const response = NextResponse.redirect(url, init);
    response.headers.set('next-pathname', request.nextUrl.pathname);
    return response;
  }

  static next(request: NextRequest, init?: any | URL) {
    const response = NextResponse.next(init);
    response.headers.set('next-pathname', request.nextUrl.pathname);
    return response;
  }
}

// Config
export const config = {
  // `payments/verify` stays excluded for the same reason as the `/:shop/:product/order`
  // pass-through above: the page itself went with `(Shop)`, and skipping the middleware lets the
  // stale gateway-return URL 404 instead of bouncing the buyer to `/auth`. The subscription
  // payment return is a different path (`/settings/subscription/verify`) and is unaffected.
  matcher: [
    '/((?!api|payments/verify|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|fonts).*)',
  ],
};
