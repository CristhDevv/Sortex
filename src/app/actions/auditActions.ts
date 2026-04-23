'use server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function logAuditEvent({
  actor_id,
  actor_name,
  actor_role,
  action,
  entity,
  entity_id,
  metadata,
}: {
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity: string;
  entity_id?: string;
  metadata?: Record<string, any>;
}) {
  const { error } = await supabaseAdmin.from('audit_logs').insert([{
    actor_id,
    actor_name,
    actor_role,
    action,
    entity,
    entity_id: entity_id || null,
    metadata: metadata || null,
  }]);

  if (error) {
    console.error('Error writing audit log:', error.message);
  }
}

export async function getAuditLogs({
  limit = 50,
  action,
  actor_role,
}: {
  limit?: number;
  action?: string;
  actor_role?: string;
} = {}) {
  let query = supabaseAdmin
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (action) query = query.eq('action', action);
  if (actor_role) query = query.eq('actor_role', actor_role);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching audit logs:', error.message);
    return [];
  }
  return data;
}
