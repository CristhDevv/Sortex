'use server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = new TextEncoder().encode(
  process.env.VENDOR_JWT_SECRET || 'fallback-secret'
);

export async function adminLogin(email: string, password: string) {
  const { data: user, error } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('is_active', true)
    .single();

  if (error || !user) return { error: 'Usuario no encontrado' };

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return { error: 'Contraseña incorrecta' };

  const token = await new SignJWT({ 
    id: user.id, 
    email: user.email, 
    role: user.role,
    name: user.name
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  const cookieName = user.role === 'owner' ? 'owner_session' : 'admin_session';

  cookies().set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return { success: true, role: user.role };
}

export async function adminLogout() {
  cookies().delete('admin_session');
  cookies().delete('owner_session');
}

export async function createAdminUser(name: string, email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const { error } = await supabaseAdmin
    .from('admin_users')
    .insert([{ name, email: email.toLowerCase().trim(), password: hashedPassword, role: 'admin', is_active: true }]);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getAdminUsers() {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, name, email, role, is_active, created_at')
    .eq('role', 'admin')
    .order('created_at', { ascending: false });
  if (error) return { error: error.message };
  return { data };
}

export async function getAdminPermissions() {
  const { data, error } = await supabaseAdmin
    .from('admin_permissions')
    .select('*');
  if (error) return { error: error.message };
  return { data };
}

export async function toggleAdminPermission(userId: string, permissionKey: string, currentValue: boolean, permissionId?: string) {
  if (permissionId) {
    await supabaseAdmin
      .from('admin_permissions')
      .update({ is_enabled: !currentValue })
      .eq('id', permissionId);
  } else {
    await supabaseAdmin
      .from('admin_permissions')
      .insert([{ admin_user_id: userId, permission_key: permissionKey, is_enabled: true }]);
  }
  return { success: true };
}

export async function toggleAdminUserActive(userId: string, currentValue: boolean) {
  const { error } = await supabaseAdmin
    .from('admin_users')
    .update({ is_active: !currentValue })
    .eq('id', userId);
  if (error) return { error: error.message };
  return { success: true };
}
