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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="w-24 h-24 text-green-500 mb-6 animate-bounce" />
        <h1 className="text-3xl font-black text-gray-900">¡ENVIADO!</h1>
        <p className="text-gray-500 mt-2">Tu reporte se guardó correctamente.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="flex-1 text-center font-black text-xl text-indigo-600 uppercase">
          {assignment?.lotteries?.name || 'Reporte'} - {reportType === 'midday' ? 'Mediodía' : 'Noche'}
        </h1>
        <div className="w-10"></div>
      </div>

      <main className="flex-1 p-6 flex flex-col space-y-8">
        {/* Photo Container */}
        <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-gray-200 rounded-[3rem] bg-white relative overflow-hidden">
          {preview ? (
            <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="text-center p-8">
              <Camera className="w-20 h-20 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold text-lg">SIN FOTO</p>
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
        <div className="space-y-4">
          {!preview ? (
            <label 
              htmlFor="cameraInput"
              className="w-full py-6 bg-indigo-600 text-white rounded-3xl text-2xl font-black flex items-center justify-center shadow-xl shadow-indigo-100 active:scale-95 transition-all"
            >
              <Camera className="w-8 h-8 mr-3" />
              TOMAR FOTO
            </label>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-6 bg-green-500 text-white rounded-3xl text-2xl font-black flex items-center justify-center shadow-xl shadow-green-100 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <Send className="w-8 h-8 mr-3" />
                  ENVIAR REPORTE
                </>
              )}
            </button>
          )}

          {preview && !loading && (
            <button 
              onClick={() => { setPhoto(null); setPreview(null); }}
              className="w-full py-4 text-gray-400 font-bold"
            >
              TOMAR OTRA FOTO
            </button>
          )}

          {error && (
            <p className="text-red-500 text-center font-bold text-sm bg-red-50 p-3 rounded-xl border border-red-100">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase font-black text-gray-300">Cargando...</div>}>
      <ReportContent />
    </Suspense>
  );
}
