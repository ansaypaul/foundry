import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const cleanHostname = hostname.split(':')[0];
  
  // Si admin, rediriger vers /admin
  if (hostname.startsWith('admin.') && !request.nextUrl.pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${request.nextUrl.pathname}`;
    return NextResponse.redirect(url);
  }
  
  // Auth admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = request.cookies.get('foundry-session');
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Preview mode
  const previewMatch = request.nextUrl.pathname.match(/^\/preview\/([a-f0-9-]+)(\/.*)?$/);
  if (previewMatch) {
    const siteId = previewMatch[1];
    const path = previewMatch[2] || '';
    
    const url = request.nextUrl.clone();
    url.pathname = `/sites/${siteId}${path}`;
    
    const response = NextResponse.rewrite(url);
    response.headers.set('x-foundry-is-preview', 'true');
    return response;
  }

  // Skip pour routes internes
  if (
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/sites/') ||
    request.nextUrl.pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // Résoudre le site depuis le hostname
  const { data: domain } = await supabase
    .from('domains')
    .select('site_id, site:sites!inner(status)')
    .eq('hostname', cleanHostname)
    .eq('site.status', 'active')
    .single();

  if (domain?.site_id) {
    // Rewrite vers /sites/[siteId]/[path]
    const url = request.nextUrl.clone();
    const originalPath = url.pathname;
    url.pathname = `/sites/${domain.site_id}${originalPath}`;
    
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
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
