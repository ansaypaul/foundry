import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get hostname from headers
  const hostname = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  
  // For admin routes, we don't redirect based on domain
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Pass hostname to the app via header
  const response = NextResponse.next();
  response.headers.set('x-foundry-hostname', hostname);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
