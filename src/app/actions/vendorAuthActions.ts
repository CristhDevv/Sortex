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
  console.log("--- INICIO LOGIN VENDEDOR ---");
  console.log("Alias recibido:", alias);
  
  try {
    const ip = headers().get('x-forwarded-for') || 'unknown';
    console.log("IP detectada:", ip);

    // 1. Rate Limiting Check
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabaseAdmin
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('alias', alias)
      .gte('attempted_at', fiveMinutesAgo);

    if (countError) console.error("Error al consultar intentos:", countError);

    if ((count || 0) >= 5) {
      console.log("Bloqueado por rate limiting:", alias);
      return { error: 'Demasiados intentos. Intenta en 5 minutos.' };
    }

    // Record attempt
    const { error: insertError } = await supabaseAdmin
      .from('login_attempts')
      .insert([{ alias, ip_address: ip }]);
    
    if (insertError) console.error("Error al insertar intento:", insertError);
    else console.log("Intento registrado con éxito");

    // 2. Auth Logic
    const normalizedAlias = alias.replace(/^@/, '').toLowerCase();
    console.log("Buscando vendedor:", normalizedAlias);
    
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .ilike('alias', normalizedAlias)
      .single();

    if (vendorError || !vendor) {
      console.log("Vendedor no encontrado:", normalizedAlias);
      return { error: 'Vendedor no encontrado' };
    }
    
    if (!vendor.is_active) {
      console.log("Vendedor inactivo:", normalizedAlias);
      return { error: 'Tu cuenta está desactivada' };
    }

    console.log("Comparando PIN...");
    const isPinValid = await bcrypt.compare(pin, vendor.pin);
    if (!isPinValid) {
      console.log("PIN incorrecto para:", normalizedAlias);
      return { error: 'PIN incorrecto' };
    }

    console.log("Login exitoso, generando sesión...");

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
  } catch (err: any) {
    console.error("CRASH EN SERVER ACTION:", err.message);
    return { error: 'Error interno del servidor' };
  }
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
