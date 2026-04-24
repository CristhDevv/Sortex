'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getVendorLiquidationToday } from '@/app/actions/liquidationActions';
import { ChevronLeft, Receipt, CheckCircle2 } from 'lucide-react';

export default function VendorLiquidationPage() {
  const [liquidations, setLiquidations] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const data = await getVendorLiquidationToday();
      setLiquidations(data);
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <p className="text-sm font-black tracking-widest uppercase animate-pulse" style={{ color: 'var(--text-muted)' }}>Cargando...</p>
      </div>
    );
  }

  if (!liquidations || liquidations.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--bg-page)' }}>
        <Receipt className="w-16 h-16 mb-4 opacity-20" style={{ color: 'var(--text-primary)' }} />
        <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Tu liquidación de hoy aún no ha sido procesada</h2>
        <button
          onClick={() => router.push('/vendor/dashboard')}
          className="mt-6 px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const grandTotal = liquidations.reduce((sum, liq) => sum + (liq.profit_cop || 0), 0);
  const todayFormatted = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

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
            Mi Liquidación
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest capitalize" style={{ color: 'var(--text-muted)' }}>
            {todayFormatted}
          </p>
        </div>
        <div className="w-10 flex justify-end">
          <div className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 size={16} />
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 sm:p-6 pb-12 space-y-6">
        <div className="space-y-4">
          {liquidations.map((liq) => {
            const isMidday = liq.daily_assignments?.lotteries?.draw_time === 'midday';
            return (
              <div 
                key={liq.id}
                className="p-5 rounded-2xl border shadow-sm"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                    {liq.daily_assignments?.lotteries?.name}
                  </h3>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${
                    isMidday ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {isMidday ? 'DÍA' : 'NOCHE'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 rounded-xl" style={{ background: 'var(--bg-page)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Asignadas</p>
                    <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{liq.daily_assignments?.pieces_assigned || liq.pieces_assigned}</p>
                  </div>
                  <div className="text-center p-2 rounded-xl" style={{ background: 'var(--bg-page)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Devueltas</p>
                    <p className="text-sm font-black text-rose-500">{liq.pieces_unsold}</p>
                  </div>
                  <div className="text-center p-2 rounded-xl" style={{ background: 'var(--bg-page)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Vendidas</p>
                    <p className="text-sm font-black text-emerald-500">{liq.pieces_sold}</p>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-between items-end" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>A Entregar</p>
                  <p className="text-xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    ${(liq.profit_cop || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gran Total */}
        <div 
          className="p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
              Gran Total a Entregar
            </p>
            <p className="text-5xl sm:text-6xl font-black tracking-tight tabular-nums" style={{ color: 'var(--text-primary)' }}>
              ${grandTotal.toLocaleString()}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        </div>

        <button
          onClick={() => router.push('/vendor/dashboard')}
          className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95 mt-4"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)', borderWidth: 1 }}
        >
          Volver al inicio
        </button>
      </main>
    </div>
  );
}
