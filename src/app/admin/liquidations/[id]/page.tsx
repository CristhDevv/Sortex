'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getLiquidationsByDate, processLiquidation } from '@/app/actions/liquidationActions';
import { getReportPhotoUrls } from '@/app/actions/reportActions';
import { Eye, ArrowLeft, CheckCircle2, Loader2, X, ChevronLeft, ChevronRight, Ticket, AlertCircle } from 'lucide-react';

const IMG_FILTER = { filter: 'contrast(1.3) saturate(1.4) brightness(1.05)' };

export default function LiquidationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id as string; // vendor_id
  const today = new Date().toISOString().split('T')[0];
  const date = searchParams.get('date') || today;

  const [group, setGroup] = useState<any>(null); // { vendor, assignments[] }
  const [unsoldMap, setUnsoldMap] = useState<Record<string, number>>({});
  
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // Submit error specifically for the final action
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alreadyLiquidated, setAlreadyLiquidated] = useState(false);

  useEffect(() => {
    if (lightboxIndex !== null) document.getElementById('lightbox-overlay')?.focus();
  }, [lightboxIndex]);

  useEffect(() => {
    loadData();
  }, [id, date]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setSubmitError(null);

    const groups = await getLiquidationsByDate(date) as any[];
    const found = groups.find((g: any) => g.vendor?.id === id);

    if (!found) {
      setError('No se encontraron asignaciones para este vendedor en la fecha indicada.');
      setLoading(false);
      return;
    }

    setGroup(found);

    const initialUnsold: Record<string, number> = {};
    const reportIds: string[] = [];

    found.assignments.forEach((asg: any) => {
      initialUnsold[asg.id] = asg.liquidations?.[0]?.pieces_unsold || 0;
      (asg.reports ?? []).forEach((r: any) => reportIds.push(r.id));
    });

    setUnsoldMap(initialUnsold);

    const allDone = found.assignments.every(
      (asg: any) => asg.liquidations?.[0]?.reviewed_by_admin === true
    );
    setAlreadyLiquidated(allDone);

    const urls = await getReportPhotoUrls(reportIds);
    setPhotoUrls(urls);
    setLoading(false);
  };

  const handleConfirm = async () => {
    if (!group || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const result = await processLiquidation({
      vendor_id: id,
      date,
      assignments: group.assignments.map((asg: any) => ({
        assignment_id: asg.id,
        pieces_assigned: asg.pieces_assigned,
        pieces_unsold: unsoldMap[asg.id] ?? 0,
        piece_price_cop: asg.lotteries?.piece_price_cop || 0,
      })),
    });

    if (result.success) {
      setAlreadyLiquidated(true);
      router.push(`/admin/liquidations?date=${date}`);
    } else {
      setSubmitError(result.error || 'Error al procesar la liquidación');
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

  if (error || !group) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-page)' }}>
        <p className="text-rose-400 font-bold">{error || 'Asignaciones no encontradas.'}</p>
        <button onClick={() => router.push(`/admin/liquidations?date=${date}`)} className="text-sm font-bold text-indigo-400 hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Volver a Liquidaciones
        </button>
      </div>
    );
  }

  const totalProfit = group.assignments.reduce((sum: number, asg: any) => {
    const sold = asg.pieces_assigned - (unsoldMap[asg.id] ?? 0);
    return sum + (sold * (asg.lotteries?.piece_price_cop || 0));
  }, 0);

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6" style={{ background: 'var(--bg-page)' }}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push(`/admin/liquidations?date=${date}`)} className="p-2.5 rounded-xl border transition-all hover:opacity-80" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Liquidación: {group.vendor?.name}
          </h1>
          <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>
            @{group.vendor?.alias} · {date}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {/* Left — Photo gallery */}
        <div>
          <p className="text-[10px] font-black uppercase mb-4 tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Evidencia Fotográfica Consolidada {photoUrls.length > 0 && `(${photoUrls.length})`}
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
        <div className="space-y-6 flex flex-col">
          
          {group.assignments.map((asg: any) => {
            const isMidday = asg.lotteries?.draw_time === 'midday';
            const currentUnsold = unsoldMap[asg.id] ?? 0;
            const soldCount = asg.pieces_assigned - currentUnsold;
            const rowProfit = soldCount * (asg.lotteries?.piece_price_cop || 0);

            return (
              <div 
                key={asg.id} 
                className="p-6 rounded-2xl space-y-4 border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Lotería</div>
                    <div className="text-base font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Ticket size={16} style={{ color: 'var(--text-muted)' }} />
                      {asg.lotteries?.name}
                      <span className={`px-2 py-0.5 inline-flex text-[9px] uppercase tracking-widest font-black rounded-lg ${isMidday ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                        {isMidday ? 'Día' : 'Noche'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Asignadas</div>
                    <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{asg.pieces_assigned}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase mb-3 tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>
                    Devueltas (No vendidas)
                  </label>
                  <input
                    type="number"
                    value={currentUnsold === 0 ? '' : currentUnsold}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUnsoldMap(prev => ({
                        ...prev,
                        [asg.id]: val === '' ? 0 : Math.max(0, Math.min(asg.pieces_assigned, parseInt(val) || 0))
                      }));
                    }}
                    onBlur={() => { 
                      if (isNaN(currentUnsold)) setUnsoldMap(prev => ({ ...prev, [asg.id]: 0 }));
                    }}
                    max={asg.pieces_assigned}
                    min={0}
                    placeholder="0"
                    className="w-full py-3 px-4 border rounded-xl text-xl font-black text-center focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                  />
                  <div className="flex justify-between items-center mt-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    <span>Vendidas: <span style={{ color: 'var(--text-primary)' }}>{soldCount}</span></span>
                    <span>Subtotal: <span className="text-indigo-400">${rowProfit.toLocaleString()}</span></span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Gran Total y Botón */}
          <div className="border p-6 sm:p-8 rounded-2xl shadow-2xl" style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)' }}>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Gran Total a Cobrar</p>
            <p className="text-4xl sm:text-5xl font-black text-indigo-400 mb-6">${totalProfit.toLocaleString()}</p>
            
            {submitError && (
              <div className="mb-4 p-4 rounded-xl flex items-start gap-3 bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm font-bold leading-tight">{submitError}</p>
              </div>
            )}

            {alreadyLiquidated ? (
              <div className="w-full py-4 sm:py-5 rounded-xl font-black text-lg sm:text-xl tracking-wide flex items-center justify-center gap-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={22} />
                VENDEDOR YA LIQUIDADO
              </div>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full py-4 sm:py-5 bg-indigo-500 text-white rounded-xl font-black text-lg sm:text-xl tracking-wide hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <><Loader2 className="animate-spin" size={22} /> Procesando...</>
                ) : (
                  <><CheckCircle2 size={22} /> CONFIRMAR LIQUIDACIÓN</>
                )}
              </button>
            )}
          </div>
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
