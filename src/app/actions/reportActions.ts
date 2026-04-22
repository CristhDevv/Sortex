'use server';

import { createClient } from '@supabase/supabase-js';
import { getVendorSession } from './vendorAuthActions';
import { toZonedTime } from 'date-fns-tz';

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
  
  // 1. Calculate is_on_time
  const hours = zonedNow.getHours();
  const minutes = zonedNow.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  let isOnTime = false;
  if (reportType === 'midday') {
    isOnTime = timeInMinutes <= 13 * 60; // 1:00 PM
  } else if (reportType === 'night') {
    isOnTime = timeInMinutes <= 22 * 60; // 10:00 PM
  }

  // 2. Upload to Storage
  // Path: /{vendor_id}/{date}/{report_type}_{timestamp}.jpg
  const fileExt = photoFile.name.split('.').pop();
  const filePath = `${session.id}/${dateStr}/${reportType}_${timestamp}.${fileExt}`;

  const { data: storageData, error: storageError } = await supabaseAdmin
    .storage
    .from('reports-photos')
    .upload(filePath, photoFile, {
      contentType: photoFile.type,
      upsert: true
    });

  if (storageError) return { error: `Error subiendo foto: ${storageError.message}` };

  // 3. Save to Database
  const { error: dbError } = await supabaseAdmin.from('reports').insert([{
    vendor_id: session.id,
    assignment_id: assignmentId,
    report_type: reportType,
    photo_url: filePath, // Relative path
    unsold_tickets: 0, // Manual entry removed per business decision
    submitted_at: now.toISOString(),
    is_on_time: isOnTime,
  }]);

  if (dbError) return { error: `Error guardando reporte: ${dbError.message}` };

  return { success: true };
}

// Action to generate Signed URL
export async function getSignedPhotoUrl(path: string) {
  const { data, error } = await supabaseAdmin
    .storage
    .from('reports-photos')
    .createSignedUrl(path, 60); // 60 seconds

  if (error) return null;
  return data.signedUrl;
}

// Utility import needed for date formatting
import { format } from 'date-fns-tz';
