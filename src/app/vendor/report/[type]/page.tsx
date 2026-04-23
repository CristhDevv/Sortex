'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { submitReportWithPhoto } from '@/app/actions/reportActions';
import { getVendorSession } from '@/app/actions/vendorAuthActions';
import { Camera, Send, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

function ReportContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportType = params.type as 'midday' | 'night';
  const assignmentId = searchParams.get('assignment_id');
  
  const [assignment, setAssignment] = useState<any>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Consulta específica por ID de asignación
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

    setLoading(true);
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        initialQuality: 0.7
      };
      
      const compressedFile = await imageCompression(file, options);
      setPhoto(compressedFile);
      setPreview(URL.createObjectURL(compressedFile));
    } catch (err) {
      setError('Error al procesar la imagen');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!photo || !assignment) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('assignment_id', assignment.id);
    formData.append('report_type', reportType);
    formData.append('photo', photo);

    const result = await submitReportWithPhoto(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/vendor/dashboard'), 2000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">¡ENVIADO!</h1>
        <p className="text-zinc-500 mt-2 font-bold text-sm">Tu reporte se guardó correctamente.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 shadow-sm flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center flex-1">
          <h1 className="font-black text-lg text-white uppercase tracking-tight">
            {assignment?.lotteries?.name || 'Reporte'}
          </h1>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            {reportType === 'midday' ? 'Mediodía' : 'Noche'}
          </p>
        </div>
        <div className="w-10"></div>
      </div>

      <main className="flex-1 p-4 sm:p-6 flex flex-col space-y-6 sm:space-y-8">
        {/* Photo Container */}
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-[2.5rem] bg-zinc-900 relative overflow-hidden shadow-2xl">
          {preview ? (
            <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-zinc-500" />
              </div>
              <p className="text-zinc-500 font-black text-sm uppercase tracking-widest">SIN FOTO</p>
            </div>
          )}
          
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="absolute inset-0 opacity-0 cursor-pointer"
            id="cameraInput"
          />
        </div>

        {/* Action Button */}
        <div className="space-y-4 pb-8">
          {!preview ? (
            <label 
              htmlFor="cameraInput"
              className="w-full py-5 sm:py-6 bg-indigo-500 text-white rounded-2xl text-xl sm:text-2xl font-black flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer tracking-wide"
            >
              <Camera className="w-7 h-7 sm:w-8 sm:h-8 mr-3" />
              TOMAR FOTO
            </label>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-5 sm:py-6 bg-emerald-500 text-white rounded-2xl text-xl sm:text-2xl font-black flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 tracking-wide"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin mr-3" />
                  ENVIANDO...
                </div>
              ) : (
                <>
                  <Send className="w-7 h-7 sm:w-8 sm:h-8 mr-3" />
                  ENVIAR REPORTE
                </>
              )}
            </button>
          )}

          {preview && !loading && (
            <button 
              onClick={() => { setPhoto(null); setPreview(null); }}
              className="w-full py-4 text-zinc-500 font-black text-xs sm:text-sm uppercase tracking-widest hover:text-white transition-colors"
            >
              TOMAR OTRA FOTO
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 uppercase font-black tracking-widest text-zinc-500 text-xs">
        Cargando...
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
