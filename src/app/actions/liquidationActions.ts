'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';
import { logAuditEvent } from '@/app/actions/auditActions';
import { getVendorSession } from '@/app/actions/vendorAuthActions';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Procesa la liquidación de una asignación específica,
 * calculando la utilidad (profit) basada en las fracciones vendidas.
 */
export async function processLiquidation(data: {
  vendor_id: string;
  date: string;
  assignments: {
    assignment_id: string;
    pieces_assigned: number;
    pieces_unsold: number;
    piece_price_cop: number;
  }[];
  notes?: string;
}) {
  try {
    let totalProfit = 0;
    let totalPiecesAssigned = 0;
    let totalPiecesSold = 0;
    let totalPiecesUnsold = 0;

    // 1. Calcular valores y preparar el array para el upsert masivo
    const upsertData = data.assignments.map(asg => {
      const piecesSold = asg.pieces_assigned - asg.pieces_unsold;
      const profitCop = piecesSold * asg.piece_price_cop; // Usamos el price_cop correcto para el total a cobrar

      totalProfit += profitCop;
      totalPiecesAssigned += asg.pieces_assigned;
      totalPiecesSold += piecesSold;
      totalPiecesUnsold += asg.pieces_unsold;

      return {
        assignment_id: asg.assignment_id,
        vendor_id: data.vendor_id,
        date: data.date,
        pieces_assigned: asg.pieces_assigned,
        pieces_sold: piecesSold,
        pieces_unsold: asg.pieces_unsold,
        profit_cop: profitCop,
        reviewed_by_admin: true,
        notes: data.notes ?? null
      };
    });

    // 2. Ejecutar upsert en lote
    const { error, data: upsertResult } = await supabaseAdmin
      .from('liquidations')
      .upsert(upsertData, { onConflict: 'assignment_id' })
      .select('id');

    if (error) return { error: error.message };

    // Verificar que se procesaron todas las asignaciones
    if (!upsertResult || upsertResult.length !== data.assignments.length) {
      return { error: 'Algunas liquidaciones no se procesaron correctamente' };
    }

    revalidatePath('/admin/liquidations');
    revalidatePath(`/admin/liquidations/${data.vendor_id}`);
    revalidatePath('/admin/history');

    // 3. Registrar un solo evento de auditoría consolidado
    await logAuditEvent({
      actor_id: data.vendor_id,
      actor_name: 'admin',
      actor_role: 'admin',
      action: 'liquidation_processed',
      entity: 'liquidations',
      entity_id: data.vendor_id,
      metadata: {
        date: data.date,
        total_assignments: data.assignments.length,
        total_pieces_assigned: totalPiecesAssigned,
        total_pieces_sold: totalPiecesSold,
        total_pieces_unsold: totalPiecesUnsold,
        total_profit_cop: totalProfit,
        notes: data.notes || null
      }
    });

    return { success: true, totalProfit };
  } catch (error: any) {
    console.error('Error en processLiquidation:', error);
    return { error: error.message || 'Error interno del servidor' };
  }
}

/**
 * Obtiene todas las asignaciones del día con sus respectivas liquidaciones
 * para el panel de revisión del propietario/admin.
 */
export async function getLiquidationsByDate(date: string) {
  noStore();

  const { data: assignments, error: asgError } = await supabaseAdmin
    .from('daily_assignments')
    .select(`
      *,
      vendors (id, name, alias),
      lotteries (name, draw_time, piece_profit_cop, piece_price_cop),
      reports (id, report_type)
    `)
    .eq('date', date)
    .order('created_at', { ascending: false });

  if (asgError) {
    console.error('Error fetching assignments:', asgError);
    return [];
  }

  const { data: liquidations, error: liqError } = await supabaseAdmin
    .from('liquidations')
    .select('id, assignment_id, profit_cop, pieces_sold, pieces_unsold, pieces_assigned, reviewed_by_admin')
    .eq('date', date);

  if (liqError) {
    console.error('Error fetching liquidations:', liqError);
    return [];
  }

  const liqMap = new Map(liquidations.map(l => [l.assignment_id, l]));

  const merged = assignments.map(asg => ({
    ...asg,
    liquidations: liqMap.has(asg.id) ? [liqMap.get(asg.id)] : []
  }));

  const grouped = merged.reduce((acc, asg) => {
    const key = asg.vendor_id;
    if (!acc[key]) acc[key] = { vendor: asg.vendors, assignments: [] };
    acc[key].assignments.push(asg);
    return acc;
  }, {} as Record<string, { vendor: any; assignments: any[] }>);

  return Object.values(grouped);
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
        pieces_assigned,
        lotteries (name, draw_time, piece_price_cop)
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

export async function getVendorLiquidationToday() {
  const session = await getVendorSession();
  if (!session) return null;
  
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Bogota'
  });
  
  const { data, error } = await supabaseAdmin
    .from('liquidations')
    .select(`
      *,
      daily_assignments (
        pieces_assigned,
        lotteries (name, draw_time, piece_price_cop)
      )
    `)
    .eq('vendor_id', session.id)
    .eq('date', today);
    
  if (error) {
    console.error('Error fetching vendor liquidation today:', error);
    return null;
  }
  return data && data.length > 0 ? data : null;
}
