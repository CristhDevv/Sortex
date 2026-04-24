'use server';

import { createClient } from '@supabase/supabase-js';
import { getVendorSession } from './vendorAuthActions';
import { toZonedTime, format } from 'date-fns-tz';

// Initialize Supabase with Service Role for Storage and Private Data
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TIMEZONE = 'America/Bogota';

export async function submitReportWithPhoto(formData: FormData) {
  const session = await getVendorSession();
  if (!session) throw new Error('Unauthorized');

  const assignmentId = formData.get('assignment_id') as string;
  const reportType = formData.get('report_type') as 'midday' | 'night';
  const photoFile = formData.get('photo') as File;

  if (!photoFile) return { error: 'La foto es obligatoria' };

  const now = new Date();
  const zonedNow = toZonedTime(now, TIMEZONE);
  const dateStr = format(zonedNow, 'yyyy-MM-dd', { timeZone: TIMEZONE });
  const timestamp = now.getTime();

  // Calculate is_on_time
  const hours = zonedNow.getHours();
  const minutes = zonedNow.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  let isOnTime = false;
  if (reportType === 'midday') {
    isOnTime = timeInMinutes <= 13 * 60; // 1:00 PM
  } else if (reportType === 'night') {
    isOnTime = timeInMinutes <= 22 * 60; // 10:00 PM
  }

  // 1. Find or create the report row
  const { data: existingReport } = await supabaseAdmin
    .from('reports')
    .select('id')
    .eq('assignment_id', assignmentId)
    .eq('report_type', reportType)
    .maybeSingle();

  let reportId: string;

  if (existingReport) {
    // Reuse existing report — photo_url in reports is intentionally not touched
    reportId = existingReport.id;
  } else {
    // Create new report row (photo_url omitted — multi-photo lives in report_photos)
    const { data: newReport, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert([{
        vendor_id: session.id,
        assignment_id: assignmentId,
        report_type: reportType,
        unsold_tickets: 0,
        submitted_at: now.toISOString(),
        is_on_time: isOnTime,
      }])
      .select('id')
      .single();

    if (reportError || !newReport) {
      return { error: `Error creando reporte: ${reportError?.message}` };
    }
    reportId = newReport.id;
  }

  // 2. Upload photo to Storage
  // Path: /{vendor_id}/{date}/{report_type}_{timestamp}.{ext}
  const fileExt = photoFile.name.split('.').pop();
  const filePath = `${session.id}/${dateStr}/${reportType}_${timestamp}.${fileExt}`;

  const { error: storageError } = await supabaseAdmin
    .storage
    .from('reports-photos')
    .upload(filePath, photoFile, {
      contentType: photoFile.type,
      upsert: true,
    });

  if (storageError) return { error: `Error subiendo foto: ${storageError.message}` };

  // 3. Count existing photos for this report (to set correct order)
  const { count } = await supabaseAdmin
    .from('report_photos')
    .select('*', { count: 'exact', head: true })
    .eq('report_id', reportId);

  // 4. Insert into report_photos
  const { error: photoError } = await supabaseAdmin
    .from('report_photos')
    .insert([{
      report_id: reportId,
      photo_url: filePath,
      order: (count ?? 0) + 1,
    }]);

  if (photoError) return { error: `Error guardando foto: ${photoError.message}` };

  return { success: true };
}

// Generate a signed URL for a Storage path (valid for 90 days)
export async function getSignedPhotoUrl(path: string) {
  const { data, error } = await supabaseAdmin
    .storage
    .from('reports-photos')
    .createSignedUrl(path, 7_776_000); // 90 días

  if (error) return null;
  return data.signedUrl;
}

/**
 * Obtiene todas las URLs firmadas de report_photos para un conjunto de report IDs,
 * ordenadas por "order" ascendente.
 */
export async function getReportPhotoUrls(reportIds: string[]): Promise<string[]> {
  if (reportIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from('report_photos')
    .select('photo_url')
    .in('report_id', reportIds)
    .order('order', { ascending: true });

  if (error || !data) return [];

  const urls = await Promise.all(
    data.map(async (p) => {
      const { data: signed } = await supabaseAdmin
        .storage
        .from('reports-photos')
        .createSignedUrl(p.photo_url, 7_776_000);
      return signed?.signedUrl ?? null;
    })
  );

  return urls.filter((u): u is string => u !== null);
}
