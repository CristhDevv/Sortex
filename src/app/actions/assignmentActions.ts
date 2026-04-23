'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

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
      reports (report_type)
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
  return { success: true };
}
