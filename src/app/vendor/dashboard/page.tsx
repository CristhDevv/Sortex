'use client';

import { useEffect, useState } from 'react';
import { 
  getVendorSession, 
  vendorLogout, 
  getVendorAssignmentsToday 
} from '@/app/actions/vendorAuthActions';
import { LogOut, Camera, CheckCircle2, AlertTriangle, Clock, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toZonedTime } from 'date-fns-tz';
import Link from 'next/link';

const TIMEZONE = 'America/Bogota';

export default function VendorDashboard() {
  const [vendor, setVendor] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const session = await getVendorSession();
    if (!session) { router.push('/vendor/login'); return; }
    setVendor(session);
    
    // Nueva Server Action que utiliza supabaseAdmin
    const asgs = await getVendorAssignmentsToday(session.id);
    setAssignments(asgs);
    setLoading(false);
  };

  const isLate = (limitHour: number) =>
    toZonedTime(new Date(), TIMEZONE).getHours() >= limitHour;

  const handleLogout = async () => {
    await vendorLogout();
    router.push('/vendor/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <p className="text-sm text-zinc-500 font-black tracking-widest uppercase animate-pulse">Cargando...</p>
    </div>
  );

  // Cálculo de cartera total basado en pedazos asignados * precio de cada lotería
  const totalCartera = assignments.reduce((acc, asg) => {
    const price = asg.lotteries?.piece_price_cop || 0;
    return acc + (asg.pieces_assigned * price);
  }, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-12 pb-6">
        <div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Sortex · Vendedor</p>
          <h1 className="text-2xl font-black text-white tracking-tight">{vendor?.alias}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-sm"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 px-4 sm:px-6 pb-12 space-y-8">

        {/* Cartera del día */}
        <section className="bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Total para recaudar hoy</p>
            {assignments.length > 0 ? (
              <>
                <p className="text-5xl sm:text-6xl font-black text-white tracking-tight tabular-nums">
                  ${totalCartera.toLocaleString()}
                </p>
                <p className="text-zinc-500 text-[10px] mt-1.5 uppercase font-black tracking-widest">Cartera Total</p>
                
                {/* Desglose rápido de loterías */}
                <div className="mt-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {assignments.map(asg => (
                    <div key={asg.id} className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl px-4 py-3 border border-zinc-700/50 shrink-0 min-w-[100px]">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{asg.lotteries?.name}</p>
                      <p className="text-base font-black text-white">{asg.pieces_assigned} frac.</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-6">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Sin asignación para hoy.</p>
              </div>
            )}
          </div>
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        </section>

        {/* Reportes por Lotería */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <Ticket className="w-4 h-4 text-indigo-400" />
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tus Tareas</p>
          </div>
          
          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map((asg) => {
                const isMidday = asg.lotteries?.draw_time === 'midday';
                const limitHour = isMidday ? 13 : 22;
                const limitLabel = isMidday ? '1:00 PM' : '10:00 PM';
                const isReported = asg.reports && asg.reports.length > 0;
                const late = isLate(limitHour);
                
                return (
                  <div 
                    key={asg.id} 
                    className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all ${
                      isReported 
                        ? 'bg-emerald-500/5 border-emerald-500/20' 
                        : late 
                          ? 'bg-amber-500/5 border-amber-500/20' 
                          : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        isReported ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {isReported ? <CheckCircle2 size={24} /> : <Ticket size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-base sm:text-lg font-black text-white leading-tight">{asg.lotteries?.name}</p>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border ${
                            isMidday ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {isMidday ? 'Día' : 'Noche'}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center">
                          <Clock className="w-3 h-3 mr-1 opacity-50" />
                          Límite: {limitLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isReported ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Enviado</span>
                          {asg.reports[0].is_on_time ? (
                            <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest mt-0.5">A tiempo</span>
                          ) : (
                            <span className="text-[8px] text-amber-500 uppercase font-black tracking-widest mt-0.5">Tarde</span>
                          )}
                        </div>
                      ) : (
                        <>
                          {late && (
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mr-1 text-right leading-tight hidden sm:block">Fuera de<br/>tiempo</span>
                          )}
                          <Link href={`/vendor/report/${asg.lotteries?.draw_time}?assignment_id=${asg.id}`}>
                            <button
                              className={`p-3 sm:p-4 rounded-xl transition-all active:scale-95 shadow-lg ${
                                late ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-amber-500/20' : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-indigo-500/20'
                              }`}
                            >
                              <Camera size={24} />
                            </button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 border-dashed text-center">
                <AlertTriangle className="mx-auto text-zinc-700 mb-4" size={40} />
                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">No tienes tareas asignadas hoy.</p>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
