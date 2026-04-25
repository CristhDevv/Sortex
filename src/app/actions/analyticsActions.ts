'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Obtiene las ganancias agrupadas por Lotería en un rango de fechas.
 */
export async function getProfitByLottery(from: string, to: string) {
  const { data, error } = await supabaseAdmin
    .from('liquidations')
    .select(`
      profit_cop,
      assignment_id,
      daily_assignments!inner (
        lotteries!inner (name)
      )
    `)
    .gte('date', from)
    .lte('date', to);

  if (error) {
    console.error('Error fetching profit by lottery:', error);
    return [];
  }

  const grouped = data.reduce((acc: any, curr: any) => {
    // @ts-ignore - Acceso a joins anidados con !inner
    const name = curr.daily_assignments?.lotteries?.name || 'Desconocida';
    acc[name] = (acc[name] || 0) + Number(curr.profit_cop);
    return acc;
  }, {});

  return Object.entries(grouped).map(([label, value]) => ({ label, value: value as number }));
}

/**
 * Obtiene las ganancias agrupadas por Día en un rango de fechas.
 */
export async function getProfitByDay(from: string, to: string) {
  const { data, error } = await supabaseAdmin
    .from('liquidations')
    .select('date, profit_cop')
    .gte('date', from)
    .lte('date', to);

  if (error) {
    console.error('Error fetching profit by day:', error);
    return [];
  }

  const grouped = data.reduce((acc: any, curr: any) => {
    const dateStr = curr.date;
    acc[dateStr] = (acc[dateStr] || 0) + Number(curr.profit_cop);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value: value as number }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Obtiene las ganancias agrupadas por Vendedor en un rango de fechas.
 */
export async function getProfitByVendor(from: string, to: string) {
  const { data, error } = await supabaseAdmin
    .from('liquidations')
    .select(`
      profit_cop,
      vendors!inner (name)
    `)
    .gte('date', from)
    .lte('date', to);

  if (error) {
    console.error('Error fetching profit by vendor:', error);
    return [];
  }

  const grouped = data.reduce((acc: any, curr: any) => {
    // @ts-ignore - Acceso a join con !inner
    const name = curr.vendors?.name || 'Vendedor Desconocido';
    acc[name] = (acc[name] || 0) + Number(curr.profit_cop);
    return acc;
  }, {});

  return Object.entries(grouped).map(([label, value]) => ({ label, value: value as number }));
}

/**
 * Obtiene las ganancias agrupadas por Jornada (draw_time) en un rango de fechas.
 */
export async function getProfitByJornada(from: string, to: string) {
  const { data, error } = await supabaseAdmin
    .from('liquidations')
    .select(`
      profit_cop,
      assignment_id,
      daily_assignments!inner (
        lotteries!inner (draw_time)
      )
    `)
    .gte('date', from)
    .lte('date', to);

  if (error) {
    console.error('Error fetching profit by jornada:', error);
    return [];
  }

  const grouped = data.reduce((acc: any, curr: any) => {
    // @ts-ignore - Acceso a joins anidados con !inner
    const drawTime = curr.daily_assignments?.lotteries?.draw_time;
    const jornada = drawTime === 'midday' ? 'Mediodía' : (drawTime === 'night' ? 'Noche' : 'Desconocida');
    acc[jornada] = (acc[jornada] || 0) + Number(curr.profit_cop);
    return acc;
  }, {});

  return Object.entries(grouped).map(([label, value]) => ({ label, value: value as number }));
}

/**
 * Obtiene el historial detallado de un vendedor, incluyendo totales acumulados
 * y el desglose día por día de asignaciones y liquidaciones.
 */
export async function getVendorHistory(vendorId: string) {
  // 1. Obtener información básica del vendedor
  const { data: vendor, error: vError } = await supabaseAdmin
    .from('vendors')
    .select('name, alias, is_active')
    .eq('id', vendorId)
    .single();

  if (vError) {
    console.error('Error fetching vendor info:', vError);
    return null;
  }

  // 2. Obtener historial de asignaciones
  const { data: assignments, error: hError } = await supabaseAdmin
    .from('daily_assignments')
    .select(`
      id,
      date,
      pieces_assigned,
      lotteries!inner (
        name,
        draw_time
      )
    `)
    .eq('vendor_id', vendorId)
    .order('date', { ascending: false });

  if (hError) {
    console.error('Error fetching vendor history:', hError);
    return null;
  }

  // 2b. Obtener liquidaciones del vendedor por separado
  const { data: liquidations, error: liqError } = await supabaseAdmin
    .from('liquidations')
    .select('assignment_id, pieces_assigned, pieces_sold, pieces_unsold, profit_cop, reviewed_by_admin')
    .eq('vendor_id', vendorId);

  if (liqError) {
    console.error('Error fetching vendor liquidations:', liqError);
    return null;
  }

  const liqMap = new Map(liquidations.map(l => [l.assignment_id, l]));

  const history = assignments.map(asg => ({
    ...asg,
    liquidations: liqMap.has(asg.id) ? [liqMap.get(asg.id)] : []
  }));

  // 3. Calcular totales acumulados basados solo en registros liquidados
  const totals = history.reduce((acc, curr) => {
    const liq = curr.liquidations?.[0];
    if (liq) {
      acc.assigned += Number(liq.pieces_assigned || 0);
      acc.sold += Number(liq.pieces_sold || 0);
      acc.unsold += Number(liq.pieces_unsold || 0);
      acc.profit += Number(liq.profit_cop || 0);
    } else {
      // Si no hay liquidación, solo sumamos lo asignado inicialmente
      acc.assigned += Number(curr.pieces_assigned || 0);
    }
    return acc;
  }, { assigned: 0, sold: 0, unsold: 0, profit: 0 });

  return {
    vendor,
    history,
    totals
  };
}
