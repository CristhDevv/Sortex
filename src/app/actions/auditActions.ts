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
