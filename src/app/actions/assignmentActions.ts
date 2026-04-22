'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function createAssignment(formData: {
  vendor_id: string;
  date: string;
  total_tickets: number;
  ticket_value_cop: number;
}) {
  const { error } = await supabase.from('daily_assignments').insert([formData]);

  if (error) {
    if (error.code === '23505') {
      return { error: 'Este vendedor ya tiene una asignación para esta fecha' };
    }
    return { error: error.message };
  }

  revalidatePath('/admin/assignments');
  return { success: true };
}

export async function getDailyAssignments(date: string) {
  const { data, error } = await supabase
    .from('daily_assignments')
    .select(`
      *,
      vendors (name, alias),
      reports (report_type)
    `)
    .eq('date', date);

  if (error) return [];
  return data;
}
