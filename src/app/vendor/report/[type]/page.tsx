'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { submitReportWithPhoto } from '@/app/actions/reportActions';
import { getVendorSession } from '@/app/actions/vendorAuthActions';
import { Camera, Send, ChevronLeft, Loader2, CheckCircle2, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const MAX_PHOTOS = 10;

function ReportContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportType = params.type as 'midday' | 'night';
  const assignmentId = searchParams.get('assignment_id');

  const [assignment, setAssignment] = useState<any>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup ObjectURLs on previews change or unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  useEffect(() => {
    async function init() {
      const session = await getVendorSession();
      if (!session) {
        router.push('/vendor/login');
        return;
      }

      if (!assignmentId) {
        router.push('/vendor/dashboard');
        return;
      }

      const { data } = await supabase
        .from('daily_assignments')
        .select('*, lotteries(name, draw_time)')
        .eq('id', assignmentId)
        .single();

      if (data) setAssignment(data);
    }
    init();
  }, [assignmentId, router]);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear input so the same file can be selected again if needed
    e.target.value = '';

    if (photos.length >= MAX_PHOTOS) return;

    setLoading(true);
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        initialQuality: 0.7,
      };

      const compressed = await imageCompression(file, options);
      setPhotos((prev) => [...prev, compressed]);
      setPreviews((prev) => [...prev, URL.createObjectURL(compressed)]);
    } catch {
      setError('Error al procesar la imagen');
    }
    setLoading(false);
  };

  const handleRemovePhoto = (idx: number) => {
    // Revoke the specific ObjectURL before removing it
    URL.revokeObjectURL(previews[idx]);
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (photos.length === 0 || !assignment) return;

    setLoading(true);
    setError(null);

    const errors: string[] = [];

    for (const photoFile of photos) {
      const fd = new FormData();
      fd.append('assignment_id', assignment.id);
      fd.append('report_type', reportType);
      fd.append('photo', photoFile);
      const result = await submitReportWithPhoto(fd);
      if (result.error) errors.push(result.error);
    }

    if (errors.length > 0) {
      setError(`${errors.length} de ${photos.length} foto(s) no se enviaron. Intenta de nuevo.`);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/vendor/dashboard'), 2000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--bg-page)' }}>
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
        </div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>¡ENVIADO!</h1>
        <p className="mt-2 font-bold text-sm" style={{ color: 'var(--text-muted)' }}>Tu reporte se guardó correctamente.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>

      {/* Header */}
      <div
        className="border-b p-4 shadow-sm flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl transition-all"
          style={{ background: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center flex-1">
          <h1 className="font-black text-lg uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {assignment?.lotteries?.name || 'Reporte'}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {reportType === 'midday' ? 'Mediodía' : 'Noche'}
          </p>
        </div>
        <div className="w-10" />
      </div>

      <main className="flex-1 p-4 sm:p-6 flex flex-col space-y-4 sm:space-y-6">

        {/* Photo grid */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {previews.map((src, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-2xl overflow-hidden border"
                style={{ borderColor: 'var(--border)' }}
              >
                <img src={src} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemovePhoto(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all"
                  aria-label={`Eliminar foto ${idx + 1}`}
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="absolute bottom-1 left-1 text-[10px] font-black bg-black/60 text-white px-1.5 py-0.5 rounded-lg">
                  {idx + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Add photo area — disabled at limit */}
        <label
          htmlFor="cameraInput"
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[2.5rem] transition-all min-h-[140px] ${
            photos.length >= MAX_PHOTOS
              ? 'opacity-40 cursor-not-allowed pointer-events-none'
              : 'cursor-pointer'
          }`}
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          {loading ? (
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--text-muted)' }} />
          ) : (
            <>
              <Camera className="w-10 h-10 mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                {photos.length === 0
                  ? 'TOMAR FOTO'
                  : photos.length >= MAX_PHOTOS
                  ? `LÍMITE ALCANZADO (${MAX_PHOTOS})`
                  : '+ AGREGAR FOTO'}
              </p>
            </>
          )}
        </label>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoCapture}
          className="hidden"
          id="cameraInput"
          disabled={photos.length >= MAX_PHOTOS || loading}
        />

        {/* Action buttons */}
        <div className="space-y-4 pb-8">
          {photos.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-5 sm:py-6 bg-emerald-500 text-white rounded-2xl text-xl sm:text-2xl font-black flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 tracking-wide"
            >
              {loading ? (
                <>
                  <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin mr-3" />
                  ENVIANDO...
                </>
              ) : (
                <>
                  <Send className="w-7 h-7 sm:w-8 sm:h-8 mr-3" />
                  ENVIAR {photos.length} FOTO{photos.length !== 1 ? 'S' : ''}
                </>
              )}
            </button>
          )}

          {error && (
            <p className="text-rose-500 text-center font-bold text-sm bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              {error}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ReportSubmissionPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center uppercase font-black tracking-widest text-xs"
          style={{ background: 'var(--bg-page)', color: 'var(--text-muted)' }}
        >
          Cargando...
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
