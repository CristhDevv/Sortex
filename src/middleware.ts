import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.VENDOR_JWT_SECRET || 'fallback-secret'
);

async function verifyToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const ownerSession = await verifyToken(request.cookies.get('owner_session')?.value);
  const adminSession = await verifyToken(request.cookies.get('admin_session')?.value);
  const vendorSession = await verifyToken(request.cookies.get('vendor_session')?.value);

  // Protect /owner routes
  if (path.startsWith('/owner') && path !== '/owner/login') {
    if (!ownerSession || ownerSession.role !== 'owner') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect /admin routes
  if (path.startsWith('/admin')) {
    const isAdmin = adminSession && (adminSession.role === 'admin' || adminSession.role === 'owner');
    const isOwnerAccessing = ownerSession && ownerSession.role === 'owner';
    if (!isAdmin && !isOwnerAccessing) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect /vendor routes
  if (path.startsWith('/vendor') && path !== '/vendor/login') {
    if (!vendorSession || vendorSession.role !== 'vendor') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/vendor/:path*', '/owner/:path*'],
};
