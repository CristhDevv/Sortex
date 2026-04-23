'use server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getLotteries() {
  const { data, error } = await supabaseAdmin
    .from('lotteries')
    .select('*')
    .order('name', { ascending: true });
  if (error) return { error: error.message };
  return { data };
}

export async function createLottery(data: any) {
  const { error } = await supabaseAdmin
    .from('lotteries')
    .insert([data]);
  if (error) return { error: error.message };
  return { success: true };
}

export async function toggleLotteryActive(id: string, currentStatus: boolean) {
  const { error } = await supabaseAdmin
    .from('lotteries')
    .update({ is_active: !currentStatus })
    .eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateLottery(id: string, data: any) {
  const { error } = await supabaseAdmin
    .from('lotteries')
    .update(data)
    .eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}
