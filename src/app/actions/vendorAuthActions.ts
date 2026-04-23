'use server';

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import { toZonedTime, format } from 'date-fns-tz';
import { logAuditEvent } from '@/app/actions/auditActions';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = new TextEncoder().encode(
  process.env.VENDOR_JWT_SECRET || 'fallback-secret-minimum-32-chars-long-12345678'
);

export async function vendorLogin(alias: string, pin: string) {
  const ip = headers().get('x-forwarded-for') || 'unknown';
  
  try {
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
  } catch (err) {
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

export async function getVendors() {
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select('id, name, alias')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) return { error: error.message };
  return { data };
}

export async function getVendorAssignmentsToday(vendorId: string) {
  const TIMEZONE = 'America/Bogota';
  const today = format(toZonedTime(new Date(), TIMEZONE), 'yyyy-MM-dd');

  const { data, error } = await supabaseAdmin
    .from('daily_assignments')
    .select(`
      *,
      lotteries (
        name,
        draw_time,
        piece_price_cop,
        piece_profit_cop
      ),
      reports (*)
    `)
    .eq('vendor_id', vendorId)
    .eq('date', today);

  if (error) {
    console.error('Error fetching vendor assignments:', error);
    return [];
  }
  
  return data;
}

export async function createVendor(data: {
  name: string;
  alias: string;
  phone: string;
  pin: string;
}) {
  const hashedPin = await bcrypt.hash(data.pin, 10);
  const { data: newVendor, error } = await supabaseAdmin
    .from('vendors')
    .insert([{ name: data.name, alias: data.alias.toLowerCase(), phone: data.phone, pin: hashedPin, is_active: true }])
    .select('id')
    .single();
  if (error) return { error: error.message };
  await logAuditEvent({
    actor_id: newVendor.id,
    actor_name: data.name,
    actor_role: 'admin',
    action: 'vendor_created',
    entity: 'vendors',
    entity_id: newVendor.id,
    metadata: { name: data.name, alias: data.alias, phone: data.phone }
  });
  return { success: true };
}

export async function updateVendor(id: string, data: {
  name: string;
  alias: string;
  phone: string;
  pin?: string;
}) {
  const updateData: any = { name: data.name, alias: data.alias.toLowerCase(), phone: data.phone };
  if (data.pin) updateData.pin = await bcrypt.hash(data.pin, 10);
  const { error } = await supabaseAdmin.from('vendors').update(updateData).eq('id', id);
  if (error) return { error: error.message };
  await logAuditEvent({
    actor_id: id,
    actor_name: data.name,
    actor_role: 'admin',
    action: 'vendor_updated',
    entity: 'vendors',
    entity_id: id,
    metadata: { name: data.name, alias: data.alias, phone: data.phone, pin_changed: !!data.pin }
  });
  return { success: true };
}

export async function toggleVendorStatus(id: string, currentStatus: boolean) {
  const { error } = await supabaseAdmin
    .from('vendors')
    .update({ is_active: !currentStatus })
    .eq('id', id);
  if (error) return { error: error.message };
  await logAuditEvent({
    actor_id: id,
    actor_name: 'admin',
    actor_role: 'admin',
    action: currentStatus ? 'vendor_deactivated' : 'vendor_activated',
    entity: 'vendors',
    entity_id: id,
    metadata: { new_status: !currentStatus }
  });
  return { success: true };
}

export async function getAllVendors() {
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select('id, name, alias, phone, is_active, created_at')
    .order('created_at', { ascending: false });
  if (error) return { error: error.message };
  return { data };
}
