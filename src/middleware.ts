import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.VENDOR_JWT_SECRET || 'fallback-secret'
);

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  // 1. Supabase Auth for Admin
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session: adminSession } } = await supabase.auth.getSession();

  // 2. Custom JWT Auth for Vendors
  const vendorToken = request.cookies.get('vendor_session')?.value;
  let vendorSession = null;
  if (vendorToken) {
    try {
      const { payload } = await jwtVerify(vendorToken, JWT_SECRET);
      vendorSession = payload;
    } catch (err) {}
  }

  const path = request.nextUrl.pathname;

  // Protect /admin routes
  if (!adminSession && path.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect /vendor routes (except /vendor/login)
  if (!vendorSession && path.startsWith('/vendor') && path !== '/vendor/login') {
    return NextResponse.redirect(new URL('/vendor/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/vendor/:path*'],
};
