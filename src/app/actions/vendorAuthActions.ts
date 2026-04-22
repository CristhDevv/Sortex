'use server';

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = new TextEncoder().encode(
  process.env.VENDOR_JWT_SECRET || 'fallback-secret-minimum-32-chars-long-12345678'
);

export async function vendorLogin(alias: string, pin: string) {
  const ip = headers().get('x-forwarded-for') || 'unknown';

  // 1. Rate Limiting Check
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('alias', alias)
    .gte('attempted_at', fiveMinutesAgo);

  if ((count || 0) >= 5) {
    return { error: 'Demasiados intentos. Intenta en 5 minutos.' };
  }

  // Record attempt
  await supabaseAdmin.from('login_attempts').insert([{ alias, ip_address: ip }]);

  // 2. Auth Logic
  const normalizedAlias = alias.replace(/^@/, '').toLowerCase();
  const { data: vendor, error } = await supabaseAdmin
    .from('vendors')
    .select('*')
    .ilike('alias', normalizedAlias)
    .single();

  if (error || !vendor) return { error: 'Vendedor no encontrado' };
  if (!vendor.is_active) return { error: 'Tu cuenta está desactivada' };

  const isPinValid = await bcrypt.compare(pin, vendor.pin);
  if (!isPinValid) return { error: 'PIN incorrecto' };

  // 3. Clear attempts on success
  await supabaseAdmin.from('login_attempts').delete().eq('alias', alias);

  // 4. Generate JWT
  const token = await new SignJWT({ id: vendor.id, alias: vendor.alias, role: 'vendor' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  cookies().set('vendor_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return { success: true };
}

export async function getVendorSession() {
  const token = cookies().get('vendor_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as any;
  } catch (err) {
    return null;
  }
}

export async function vendorLogout() {
  cookies().delete('vendor_session');
}
