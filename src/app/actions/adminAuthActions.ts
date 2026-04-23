'use server';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { logAuditEvent } from '@/app/actions/auditActions';

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

  await logAuditEvent({
    actor_id: user.id,
    actor_name: user.name,
    actor_role: user.role,
    action: user.role === 'owner' ? 'owner_login' : 'admin_login',
    entity: 'admin_users',
    entity_id: user.id,
    metadata: { email: user.email }
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

  // Obtener el usuario recién creado para el log
  const { data: newUser } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single();

  await logAuditEvent({
    actor_id: newUser?.id || 'unknown',
    actor_name: name,
    actor_role: 'admin',
    action: 'admin_user_created',
    entity: 'admin_users',
    entity_id: newUser?.id,
    metadata: { email, name }
  });

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

  await logAuditEvent({
    actor_id: userId,
    actor_name: 'owner',
    actor_role: 'owner',
    action: 'permission_changed',
    entity: 'admin_permissions',
    entity_id: userId,
    metadata: { permission_key: permissionKey, new_value: !currentValue }
  });

  return { success: true };
}

export async function toggleAdminUserActive(userId: string, currentValue: boolean) {
  const { error } = await supabaseAdmin
    .from('admin_users')
    .update({ is_active: !currentValue })
    .eq('id', userId);
  if (error) return { error: error.message };

  await logAuditEvent({
    actor_id: userId,
    actor_name: 'owner',
    actor_role: 'owner',
    action: currentValue ? 'admin_user_deactivated' : 'admin_user_activated',
    entity: 'admin_users',
    entity_id: userId,
    metadata: { new_status: !currentValue }
  });

  return { success: true };
}

export async function getActiveSession() {
  const ownerToken = cookies().get('owner_session')?.value;
  const adminToken = cookies().get('admin_session')?.value;

  if (ownerToken) {
    try {
      const { payload } = await jwtVerify(ownerToken, JWT_SECRET);
      return { role: 'owner', name: (payload as any).name };
    } catch {}
  }

  if (adminToken) {
    try {
      const { payload } = await jwtVerify(adminToken, JWT_SECRET);
      return { role: 'admin', name: (payload as any).name };
    } catch {}
  }

  return null;
}
