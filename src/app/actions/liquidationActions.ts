'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/app/actions/auditActions';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Procesa la liquidación de una asignación específica,
 * calculando la utilidad (profit) basada en las fracciones vendidas.
 */
export async function processLiquidation(data: {
  assignment_id: string;
  vendor_id: string;
  date: string;
  pieces_assigned: number;
  pieces_unsold: number;
  piece_profit_cop: number;
  notes?: string;
}) {
  // Cálculo seguro en el servidor
  const piecesSold = data.pieces_assigned - data.pieces_unsold;
  const profitCop = piecesSold * data.piece_profit_cop;

  const { error } = await supabaseAdmin.from('liquidations').upsert([{
    assignment_id: data.assignment_id,
    vendor_id: data.vendor_id,
    date: data.date,
    pieces_assigned: data.pieces_assigned,
    pieces_sold: piecesSold,
    pieces_unsold: data.pieces_unsold,
    profit_cop: profitCop,
    reviewed_by_admin: true,
    notes: data.notes
  }], { onConflict: 'assignment_id' });

  if (error) return { error: error.message };

  revalidatePath('/admin/liquidations');
  revalidatePath('/admin/history');

  await logAuditEvent({
    actor_id: data.vendor_id,
    actor_name: 'admin',
    actor_role: 'admin',
    action: 'liquidation_processed',
    entity: 'liquidations',
    entity_id: data.assignment_id,
    metadata: {
      date: data.date,
      pieces_assigned: data.pieces_assigned,
      pieces_sold: piecesSold,
      pieces_unsold: data.pieces_unsold,
      profit_cop: profitCop,
      notes: data.notes || null
    }
  });

  return { success: true };
}

/**
 * Obtiene todas las asignaciones del día con sus respectivas liquidaciones
 * para el panel de revisión del propietario/admin.
 */
export async function getLiquidationsByDate(date: string) {
  const { data, error } = await supabaseAdmin
    .from('daily_assignments')
    .select(`
      *,
      vendors (name, alias),
      lotteries (name, draw_time, piece_profit_cop, piece_price_cop),
      reports (*),
      liquidations (*)
    `)
    .eq('date', date)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching liquidations by date:', error);
    return [];
  }
  return data;
}

/**
 * Obtiene el historial completo de liquidaciones de un vendedor.
 */
export async function getLiquidationsByVendor(vendor_id: string) {
  const { data, error } = await supabaseAdmin
    .from('liquidations')
    .select(`
      *,
      daily_assignments (
        lotteries (name)
      )
    `)
    .eq('vendor_id', vendor_id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching liquidations by vendor:', error);
    return [];
  }
  return data;
}
