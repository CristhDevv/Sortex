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
      <p className="text-sm text-zinc-500 font-medium tracking-widest uppercase">Cargando...</p>
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
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Sortex · Vendedor</p>
          <h1 className="text-2xl font-black text-white tracking-tight">{vendor?.alias}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 px-6 pb-10 space-y-8">

        {/* Cartera del día */}
        <section className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-2xl shadow-indigo-900/10">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Total para recaudar hoy</p>
          {assignments.length > 0 ? (
            <>
              <p className="text-5xl font-black text-white tracking-tight">
                ${totalCartera.toLocaleString()}
              </p>
              <p className="text-zinc-500 text-sm mt-1 uppercase font-bold tracking-widest">Cartera Total</p>
              
              {/* Desglose rápido de loterías */}
              <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {assignments.map(asg => (
                  <div key={asg.id} className="bg-zinc-800/50 rounded-xl px-4 py-3 border border-zinc-700/50 shrink-0">
                    <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">{asg.lotteries?.name}</p>
                    <p className="text-lg font-black text-white">{asg.pieces_assigned} frac.</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-4">
              <p className="text-zinc-500 font-bold italic">Sin asignación para hoy.</p>
            </div>
          )}
        </section>

        {/* Reportes por Lotería */}
        <section>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Tus Tareas</p>
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
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                      isReported 
                        ? 'bg-emerald-950/30 border-emerald-800/50' 
                        : late 
                          ? 'bg-amber-950/30 border-amber-800/50' 
                          : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isReported ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {isReported ? <CheckCircle2 size={20} /> : <Ticket size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">{asg.lotteries?.name}</p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            isMidday ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-400'
                          }`}>
                            {isMidday ? 'Día' : 'Noche'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium">Límite: {limitLabel}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isReported ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Enviado</span>
                          {asg.reports[0].is_on_time ? (
                            <span className="text-[8px] text-zinc-500 uppercase">A tiempo</span>
                          ) : (
                            <span className="text-[8px] text-amber-500 uppercase">Tarde</span>
                          )}
                        </div>
                      ) : (
                        <>
                          {late && (
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider mr-1 text-right leading-tight">Fuera de<br/>tiempo</span>
                          )}
                          <Link href={`/vendor/report/${asg.lotteries?.draw_time}?assignment_id=${asg.id}`}>
                            <button
                              className={`p-3 rounded-xl transition-all active:scale-90 ${
                                late ? 'bg-amber-500 text-black' : 'bg-indigo-600 text-white'
                              }`}
                            >
                              <Camera size={20} />
                            </button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-zinc-900/50 rounded-2xl p-10 border border-zinc-800 border-dashed text-center">
                <AlertTriangle className="mx-auto text-zinc-700 mb-2" size={32} />
                <p className="text-zinc-500 text-sm font-medium">No tienes tareas asignadas hoy.</p>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
