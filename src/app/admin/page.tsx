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
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Vendedores Activos" 
          value={stats.vendors} 
          icon={<Users className="w-8 h-8 text-indigo-600" />}
          bgColor="bg-indigo-50"
        />
        <StatCard 
          title="Asignaciones Hoy" 
          value={stats.assignments} 
          icon={<ClipboardList className="w-8 h-8 text-amber-600" />}
          bgColor="bg-amber-50"
        />
        <StatCard 
          title="Reportes Recibidos" 
          value={stats.reports} 
          icon={<CheckCircle className="w-8 h-8 text-green-600" />}
          bgColor="bg-green-50"
        />
        <StatCard 
          title="Pendientes Hoy" 
          value={stats.pendingReports} 
          icon={isNearLimit ? <AlertCircle className="w-8 h-8 text-white animate-pulse" /> : <Clock className="w-8 h-8 text-rose-600" />}
          bgColor={isNearLimit ? "bg-rose-600" : "bg-rose-50"}
          textColor={isNearLimit ? "text-white" : "text-gray-900"}
          labelColor={isNearLimit ? "text-rose-100" : "text-gray-500"}
        />
      </div>

      {isNearLimit && (
        <div className="bg-rose-600 text-white p-6 rounded-3xl flex items-center justify-between shadow-lg shadow-rose-200">
          <div className="flex items-center space-x-4">
            <AlertCircle className="w-10 h-10 text-rose-200" />
            <div>
              <h2 className="text-xl font-black">¡ALERTA DE TIEMPO!</h2>
              <p className="text-rose-100 font-medium">
                Faltan menos de 30 minutos para el cierre de la jornada de {currentJornada === 'midday' ? 'Mediodía' : 'Noche'}.
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <button className="px-6 py-2 bg-white text-rose-600 rounded-xl font-bold">Ver Pendientes</button>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Estado del Sistema</h2>
        <p className="text-gray-600">
          Actualmente hay {stats.vendors} vendedores activos. Se han realizado {stats.assignments} asignaciones para hoy y se han recibido {stats.reports} reportes fotográficos.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor, textColor = "text-gray-900", labelColor = "text-gray-500" }: any) {
  return (
    <div className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4`}>
      <div className={`p-4 ${bgColor} rounded-2xl transition-colors duration-500`}>
        {icon}
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest ${labelColor}`}>{title}</p>
        <p className={`text-3xl font-black ${textColor}`}>{value}</p>
      </div>
    </div>
  );
}
