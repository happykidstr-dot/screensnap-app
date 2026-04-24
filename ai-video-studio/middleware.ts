import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/auth/callback'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, allow all routes (dev/build fallback)
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // First pass: set on request (for subsequent middleware)
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // Rebuild response so next.js picks up updated cookies
        response = NextResponse.next({ request });
        // Second pass: set on response (sent to browser)
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, {
            ...options,
            // Ensure cookies work on Netlify (sameSite must be lax for cross-origin)
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        );
      },
    },
  });

  // Refresh / validate session — IMPORTANT: do not remove
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r));

  // GİRİŞ EKRANINI İPTAL ETME: Geçici olarak giriş yapma zorunluluğunu kaldırıyoruz
  // if (!user && !isPublicRoute) {
  //   const loginUrl = request.nextUrl.clone();
  //   loginUrl.pathname = '/login';
  //   loginUrl.searchParams.set('redirected', 'true');
  //   return NextResponse.redirect(loginUrl);
  // }

  // If logged in and on /login → redirect to dashboard
  /*
  if (user && pathname === '/login') {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/';
    return NextResponse.redirect(dashboardUrl);
  }
  */

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
