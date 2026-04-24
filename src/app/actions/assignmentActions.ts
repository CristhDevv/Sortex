'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/app/actions/auditActions';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Crea una nueva asignación diaria para un vendedor
 */
export async function createAssignment(data: {
  vendor_id: string;
  lottery_id: string;
  date: string;
  pieces_assigned: number;
}) {
  const { error } = await supabaseAdmin.from('daily_assignments').insert([data]);

  if (error) {
    if (error.code === '23505') {
      return { error: 'Este vendedor ya tiene una asignación para esta lotería en esta fecha' };
    }
    return { error: error.message };
  }

  revalidatePath('/admin/assignments');

  await logAuditEvent({
    actor_id: data.vendor_id,
    actor_name: 'admin',
    actor_role: 'admin',
    action: 'assignment_created',
    entity: 'daily_assignments',
    metadata: {
      vendor_id: data.vendor_id,
      lottery_id: data.lottery_id,
      date: data.date,
      pieces_assigned: data.pieces_assigned
    }
  });

  return { success: true };
}

/**
 * Obtiene todas las asignaciones de una fecha específica con joins a vendedores y loterías
 */
export async function getAssignmentsByDate(date: string) {
  const { data, error } = await supabaseAdmin
    .from('daily_assignments')
    .select(`
      *,
      vendors (name, alias),
      lotteries (name, draw_time, piece_profit_cop),
      reports (report_type),
      liquidations (profit_cop)
    `)
    .eq('date', date)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching assignments:', error);
    return [];
  }
  return data;
}

/**
 * Obtiene el historial de asignaciones de un vendedor específico
 */
export async function getAssignmentsByVendor(vendorId: string) {
  const { data, error } = await supabaseAdmin
    .from('daily_assignments')
    .select(`
      *,
      lotteries (name)
    `)
    .eq('vendor_id', vendorId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching vendor assignments:', error);
    return [];
  }
  return data;
}

/**
 * Elimina una asignación por ID
 */
export async function deleteAssignment(id: string) {
  const { error } = await supabaseAdmin
    .from('daily_assignments')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/assignments');

  await logAuditEvent({
    actor_id: id,
    actor_name: 'admin',
    actor_role: 'admin',
    action: 'assignment_deleted',
    entity: 'daily_assignments',
    entity_id: id,
    metadata: { deleted_id: id }
  });

  return { success: true };
}

/**
 * Actualiza las fracciones asignadas de una asignación existente.
 * Bloquea la edición si ya existe una liquidación procesada.
 */
export async function updateAssignment(
  id: string,
  pieces: number
): Promise<{ success?: true; error?: string }> {
  // 1. Validación server-side: entero positivo
  if (!Number.isInteger(pieces) || pieces <= 0) {
    return { error: 'Las fracciones deben ser un número entero mayor a 0' };
  }

  // 2. Verificar que la asignación exista y obtener el valor actual
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('daily_assignments')
    .select('id, pieces_assigned')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return { error: 'Asignación no encontrada' };
  }

  // 3. Verificar que no haya una liquidación ya procesada (profit_cop no nulo)
  const { data: liquidation } = await supabaseAdmin
    .from('liquidations')
    .select('id, profit_cop')
    .eq('assignment_id', id)
    .not('profit_cop', 'is', null)
    .maybeSingle();

  if (liquidation) {
    return { error: 'No se puede modificar una asignación ya liquidada' };
  }

  // 4. Actualizar solo pieces_assigned
  const { error: updateError } = await supabaseAdmin
    .from('daily_assignments')
    .update({ pieces_assigned: pieces })
    .eq('id', id);

  if (updateError) return { error: updateError.message };

  revalidatePath('/admin/assignments');

  // 5. Audit log
  await logAuditEvent({
    actor_id: id,
    actor_name: 'admin',
    actor_role: 'admin',
    action: 'UPDATE_ASSIGNMENT',
    entity: 'daily_assignments',
    entity_id: id,
    metadata: {
      pieces_assigned_before: existing.pieces_assigned,
      pieces_assigned_after: pieces,
    },
  });

  return { success: true };
}
