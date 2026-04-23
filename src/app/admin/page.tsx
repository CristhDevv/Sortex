'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, ClipboardList, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Bogota';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    vendors: 0,
    assignments: 0,
    reports: 0,
    pendingReports: 0
  });
  const [isNearLimit, setIsNearLimit] = useState(false);
  const [currentJornada, setCurrentJornada] = useState<'midday' | 'night' | 'none'>('none');

  useEffect(() => {
    async function fetchStats() {
      const today = new Date().toISOString().split('T')[0];
      
      const { count: vendorsCount } = await supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('is_active', true);
      const { count: assignmentsCount } = await supabase.from('daily_assignments').select('*', { count: 'exact', head: true }).eq('date', today);
      const { count: reportsCount } = await supabase.from('reports').select('*', { count: 'exact', head: true }).gte('submitted_at', `${today}T00:00:00Z`);

      // Calculate pending reports
      // Assuming each assignment needs 2 reports, or just comparing to active assignments
      const pendingCount = (assignmentsCount || 0) * 2 - (reportsCount || 0);

      setStats({
        vendors: vendorsCount || 0,
        assignments: assignmentsCount || 0,
        reports: reportsCount || 0,
        pendingReports: pendingCount > 0 ? pendingCount : 0
      });

      // Check for time limits
      const now = toZonedTime(new Date(), TIMEZONE);
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = hours * 60 + minutes;

      // Midday limit: 13:00 (780 min)
      // Night limit: 22:00 (1320 min)
      if (totalMinutes < 13 * 60) {
        setCurrentJornada('midday');
        if (13 * 60 - totalMinutes <= 30) setIsNearLimit(true);
      } else if (totalMinutes < 22 * 60) {
        setCurrentJornada('night');
        if (22 * 60 - totalMinutes <= 30) setIsNearLimit(true);
      } else {
        setCurrentJornada('none');
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-zinc-950 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Panel de Control</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Vendedores Activos" 
          value={stats.vendors} 
          icon={<Users className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />}
          bgColor="bg-indigo-500/10"
          borderColor="border-indigo-500/20"
        />
        <StatCard 
          title="Asignaciones Hoy" 
          value={stats.assignments} 
          icon={<ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />}
          bgColor="bg-amber-500/10"
          borderColor="border-amber-500/20"
        />
        <StatCard 
          title="Reportes Recibidos" 
          value={stats.reports} 
          icon={<CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />}
          bgColor="bg-emerald-500/10"
          borderColor="border-emerald-500/20"
        />
        <StatCard 
          title="Pendientes Hoy" 
          value={stats.pendingReports} 
          icon={isNearLimit ? <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" /> : <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400" />}
          bgColor={isNearLimit ? "bg-rose-600 shadow-lg shadow-rose-600/20" : "bg-rose-500/10"}
          borderColor={isNearLimit ? "border-rose-500" : "border-rose-500/20"}
          textColor={isNearLimit ? "text-white" : "text-white"}
          labelColor={isNearLimit ? "text-rose-100" : "text-zinc-500"}
        />
      </div>

      {isNearLimit && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30 flex-shrink-0">
              <AlertCircle className="w-8 h-8 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-rose-400 tracking-tight">¡ALERTA DE TIEMPO!</h2>
              <p className="text-zinc-300 font-medium text-sm sm:text-base mt-1">
                Faltan menos de 30 minutos para el cierre de la jornada de {currentJornada === 'midday' ? 'Mediodía' : 'Noche'}.
              </p>
            </div>
          </div>
          <button className="w-full sm:w-auto px-6 py-3.5 bg-rose-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 active:scale-95">
            Ver Pendientes
          </button>
        </div>
      )}

      <div className="bg-zinc-900 p-6 sm:p-8 rounded-2xl border border-zinc-800 shadow-2xl">
        <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest mb-4">Estado del Sistema</h2>
        <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
          Actualmente hay <strong className="text-indigo-400">{stats.vendors}</strong> vendedores activos. Se han realizado <strong className="text-amber-400">{stats.assignments}</strong> asignaciones para hoy y se han recibido <strong className="text-emerald-400">{stats.reports}</strong> reportes fotográficos.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor, borderColor, textColor = "text-white", labelColor = "text-zinc-500" }: any) {
  return (
    <div className={`bg-zinc-900 p-5 sm:p-6 rounded-2xl border border-zinc-800 flex items-center gap-4 hover:border-zinc-700 transition-colors`}>
      <div className={`p-3 sm:p-4 ${bgColor} border ${borderColor} rounded-xl transition-colors duration-500 flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className={`text-[10px] sm:text-xs font-black uppercase tracking-widest mb-0.5 ${labelColor}`}>{title}</p>
        <p className={`text-2xl sm:text-3xl font-black ${textColor}`}>{value}</p>
      </div>
    </div>
  );
}
