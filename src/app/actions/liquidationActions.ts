'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function processLiquidation(data: {
  assignment_id: string;
  vendor_id: string;
  date: string;
  total_tickets: number;
  unsold_tickets: number;
  ticket_value: number;
  notes?: string;
}) {
  // Cálculo seguro en el servidor
  const amountDue = (data.total_tickets - data.unsold_tickets) * data.ticket_value;

  const { error } = await supabaseAdmin.from('liquidations').upsert([{
    assignment_id: data.assignment_id,
    vendor_id: data.vendor_id,
    date: data.date,
    total_tickets: data.total_tickets,
    unsold_tickets: data.unsold_tickets,
    amount_due_cop: amountDue,
    reviewed_by_admin: true,
    notes: data.notes
  }], { onConflict: 'assignment_id' });

  if (error) return { error: error.message };

  revalidatePath('/admin/liquidations');
  revalidatePath('/admin/history');
  return { success: true };
}

export async function getDailyLiquidations(date: string) {
  const { data, error } = await supabaseAdmin
    .from('daily_assignments')
    .select(`
      *,
      vendors (id, name, alias),
      reports (id, report_type, is_on_time, photo_url),
      liquidations (*)
    `)
    .eq('date', date);

  if (error) return [];
  return data;
}
