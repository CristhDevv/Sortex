'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getLiquidationsByDate, processLiquidation } from '@/app/actions/liquidationActions';
import { getReportPhotoUrls } from '@/app/actions/reportActions';
import { Eye, ArrowLeft, CheckCircle2, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';

const IMG_FILTER = { filter: 'contrast(1.3) saturate(1.4) brightness(1.05)' };

export default function LiquidationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id as string;
  const today = new Date().toISOString().split('T')[0];
  const date = searchParams.get('date') || today;

  const [item, setItem] = useState<any>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [unsold, setUnsold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Focus lightbox overlay on open so keyboard events work
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.getElementById('lightbox-overlay')?.focus();
    }
  }, [lightboxIndex]);

  useEffect(() => {
    loadData();
  }, [id, date]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const assignments = await getLiquidationsByDate(date);
    const found = assignments.find((a: any) => a.id === id);

    if (!found) {
      setError('No se encontró la asignación para la fecha indicada.');
      setLoading(false);
      return;
    }

    setItem(found);
    setUnsold(found.liquidations?.[0]?.pieces_unsold || 0);

    // Fetch all photos from report_photos for every report of this assignment
    const reportIds = (found.reports ?? []).map((r: any) => r.id);
    const urls = await getReportPhotoUrls(reportIds);
    setPhotoUrls(urls);

    setLoading(false);
  };

  const handleConfirm = async () => {
    if (!item || submitting) return;
    setSubmitting(true);

    const result = await processLiquidation({
      assignment_id: item.id,
      vendor_id: item.vendor_id,
      date,
      pieces_assigned: item.pieces_assigned,
      pieces_unsold: unsold,
      piece_profit_cop: item.lotteries.piece_profit_cop,
    });

    if (result.success) {
      router.push(`/admin/liquidations?date=${date}`);
    } else {
      alert('Error al liquidar: ' + result.error);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <Loader2 className="animate-spin text-indigo-400" size={36} />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-page)' }}>
        <p className="text-rose-400 font-bold">{error || 'Asignación no encontrada.'}</p>
        <button
          onClick={() => router.push(`/admin/liquidations?date=${date}`)}
          className="text-sm font-bold text-indigo-400 hover:underline flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Volver a Liquidaciones
        </button>
      </div>
    );
  }

  const isMidday = item.lotteries?.draw_time === 'midday';
  const soldCount = item.pieces_assigned - unsold;
  const totalProfit = soldCount * (item.lotteries?.piece_price_cop || 0);

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6" style={{ background: 'var(--bg-page)' }}>

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/admin/liquidations?date=${date}`)}
          className="p-2.5 rounded-xl border transition-all hover:opacity-80"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Liquidación: {item.vendors?.name}
          </h1>
          <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {item.lotteries?.name} · {isMidday ? 'Mediodía' : 'Noche'} · {date}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">

        {/* Left — Photo gallery */}
        <div>
          <p className="text-[10px] font-black uppercase mb-4 tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Evidencia Fotográfica {photoUrls.length > 0 && `(${photoUrls.length})`}
          </p>

          {photoUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {photoUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border cursor-zoom-in group"
                  style={{ borderColor: 'var(--border)' }}
                  onClick={() => setLightboxIndex(idx)}
                >
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    style={IMG_FILTER}
                  />
                  <span className="absolute bottom-1 left-1 text-[10px] font-black bg-black/60 text-white px-1.5 py-0.5 rounded-lg">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="h-64 border border-dashed rounded-2xl flex flex-col items-center justify-center"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <Eye className="w-16 h-16 mb-4" style={{ color: 'var(--border)' }} />
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Sin evidencia fotográfica
              </p>
            </div>
          )}
        </div>

        {/* Right — Form */}
        <div className="space-y-6 flex flex-col justify-center">

          {/* Stats Card */}
          <div
            className="p-6 rounded-2xl space-y-4 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex justify-between items-center">
              <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
                Fracciones Asignadas
              </span>
              <span className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>
                {item.pieces_assigned}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
                Utilidad x Fracción
              </span>
              <span className="font-black text-xl text-indigo-400">
                ${item.lotteries?.piece_profit_cop.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Unsold Input */}
          <div>
            <label
              className="block text-[10px] font-black uppercase mb-3 tracking-widest ml-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Devueltas (No vendidas)
            </label>
            <input
              type="number"
              value={unsold === 0 ? '' : unsold}
              onChange={(e) => {
                const val = e.target.value;
                setUnsold(val === '' ? 0 : Math.max(0, Math.min(item.pieces_assigned, parseInt(val) || 0)));
              }}
              onBlur={() => { if (isNaN(unsold)) setUnsold(0); }}
              max={item.pieces_assigned}
              min={0}
              placeholder="0"
              className="w-full py-4 sm:py-5 px-6 border rounded-xl text-2xl sm:text-3xl font-black text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              style={{
                background: 'var(--bg-card-hover)',
                borderColor: 'var(--border-hover)',
                color: 'var(--text-primary)',
              }}
            />
            <p
              className="text-center text-[10px] sm:text-xs font-bold mt-3 uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              {item.pieces_assigned} asignadas &minus; {unsold} devueltas ={' '}
              <span style={{ color: 'var(--text-primary)' }}>{soldCount} vendidas</span>
            </p>
          </div>

          {/* Total to Collect */}
          <div
            className="border p-6 sm:p-8 rounded-2xl"
            style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)' }}
          >
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">
              Total a Cobrar
            </p>
            <p className="text-4xl sm:text-5xl font-black text-indigo-400">
              ${totalProfit.toLocaleString()}
            </p>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full py-4 sm:py-5 bg-indigo-500 text-white rounded-xl font-black text-lg sm:text-xl tracking-wide hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-3"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={22} />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle2 size={22} />
                CONFIRMAR LIQUIDACIÓN
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photoUrls.length > 0 && (
        <div
          id="lightbox-overlay"
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setLightboxIndex(null);
            if (e.key === 'ArrowLeft')  setLightboxIndex((i) => Math.max(0, (i ?? 0) - 1));
            if (e.key === 'ArrowRight') setLightboxIndex((i) => Math.min(photoUrls.length - 1, (i ?? 0) + 1));
          }}
        >
          {/* Counter */}
          <p className="fixed top-4 left-4 text-white/70 text-sm font-bold bg-black/40 px-3 py-1 rounded-full select-none">
            Foto {lightboxIndex + 1} de {photoUrls.length}
          </p>

          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            className="fixed top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/25 transition-all z-10"
            aria-label="Cerrar imagen"
          >
            <X size={24} />
          </button>

          {/* Prev arrow */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i ?? 1) - 1); }}
              className="fixed left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-all z-10"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* Next arrow */}
          {lightboxIndex < photoUrls.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i ?? 0) + 1); }}
              className="fixed right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-all z-10"
              aria-label="Foto siguiente"
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* Current image */}
          <img
            src={photoUrls[lightboxIndex]}
            alt={`Evidencia ${lightboxIndex + 1} de ${photoUrls.length}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
            style={IMG_FILTER}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
