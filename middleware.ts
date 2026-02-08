import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get hostname from headers
  const hostname = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  
  // Vérifier l'authentification pour les routes admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = request.cookies.get('foundry-session');
    
    if (!session) {
      // Rediriger vers la page de login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Gérer les URLs de preview : /preview/[siteId]/...
  const previewMatch = request.nextUrl.pathname.match(/^\/preview\/([a-f0-9-]+)(\/.*)?$/);
  if (previewMatch) {
    const siteId = previewMatch[1];
    const path = previewMatch[2] || '';
    
    // Rediriger vers la route publique normale avec un header spécial
    const url = request.nextUrl.clone();
    url.pathname = path || '/';
    
    const response = NextResponse.rewrite(url);
    response.headers.set('x-foundry-preview-site-id', siteId);
    response.headers.set('x-foundry-is-preview', 'true');
    
    return response;
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
