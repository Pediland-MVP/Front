import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
  const currentRoute = request.nextUrl.pathname.split('/')[1];
  if (currentRoute === 'en' || currentRoute === 'fa') {
    const pathWithoutLocale = request.nextUrl.pathname.replace(`/${currentRoute}`, '');
    const response = NextResponse.redirect(
      new URL(pathWithoutLocale ? pathWithoutLocale : '/', request.url),
    );
    response.cookies.set('NEXT_LOCALE', currentRoute, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10),
    });
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|fonts).*)'],
};
