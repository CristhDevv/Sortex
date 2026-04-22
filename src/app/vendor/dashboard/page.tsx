'use client';

import { useEffect, useState } from 'react';
import { getVendorSession, vendorLogout } from '@/app/actions/vendorAuthActions';
import { supabase } from '@/lib/supabase';
import { LogOut, Ticket, Clock, CheckCircle2, XCircle, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Bogota';

export default function VendorDashboard() {
  const [vendor, setVendor] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const session = await getVendorSession();
    if (!session) {
      router.push('/vendor/login');
      return;
    }
    setVendor(session);

    const today = new Date().toISOString().split('T')[0];

    // Get today's assignment
    const { data: asg } = await supabase
      .from('daily_assignments')
      .select('*, reports(*)')
      .eq('vendor_id', session.id)
      .eq('date', today)
      .single();

    if (asg) {
      setAssignment(asg);
      setReports(asg.reports || []);
    }
    setLoading(false);
  };

  const isReportDone = (type: 'midday' | 'night') => {
    return reports.some(r => r.report_type === type);
  };

  const getReportStatus = (type: 'midday' | 'night', limitHour: number) => {
    const done = isReportDone(type);
    if (done) return '✓ Enviado';
    
    const now = toZonedTime(new Date(), TIMEZONE);
    if (now.getHours() >= limitHour) return '✗ Tiempo vencido';
    
    return 'Pendiente';
  };

  const handleLogout = async () => {
    await vendorLogout();
    router.push('/vendor/login');
  };

  if (loading) return <div className="p-10 text-center text-indigo-600 font-bold">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-6 rounded-b-[3rem] shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-indigo-100 text-sm font-medium">Bienvenido,</p>
            <h1 className="text-2xl font-bold">{vendor?.alias}</h1>
          </div>
          <button onClick={handleLogout} className="p-2 bg-indigo-500 rounded-full">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-6 -mt-8 space-y-6">
        {/* Assignment Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-amber-50 rounded-2xl">
              <Ticket className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Asignación de Hoy</h2>
          </div>
          
          {assignment ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Boletas</p>
                <p className="text-2xl font-black text-gray-900">{assignment.total_tickets}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Valor c/u</p>
                <p className="text-2xl font-black text-gray-900">${assignment.ticket_value_cop.toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-gray-500 font-medium">Hoy no tienes boletas asignadas</p>
            </div>
          )}
        </div>

        {/* Reports Status */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2">Estado de Reportes</h2>
          
          {/* Midday Report */}
          <ReportItem 
            title="Reporte Mediodía (1:00 PM)" 
            status={getReportStatus('midday', 13)}
            isDone={isReportDone('midday')}
            onAction={() => console.log('Open midday report')}
            canAction={!isReportDone('midday') && toZonedTime(new Date(), TIMEZONE).getHours() < 13}
          />

          {/* Night Report */}
          <ReportItem 
            title="Reporte Noche (10:00 PM)" 
            status={getReportStatus('night', 22)}
            isDone={isReportDone('night')}
            onAction={() => console.log('Open night report')}
            canAction={!isReportDone('night') && toZonedTime(new Date(), TIMEZONE).getHours() < 22}
          />
        </div>
      </main>
    </div>
  );
}

function ReportItem({ title, status, isDone, onAction, canAction }: any) {
  return (
    <div className={`bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between`}>
      <div className="flex items-center space-x-4">
        {isDone ? (
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        ) : status.includes('vencido') ? (
          <XCircle className="w-8 h-8 text-red-400" />
        ) : (
          <Clock className="w-8 h-8 text-amber-400" />
        )}
        <div>
          <p className="text-sm font-bold text-gray-800">{title}</p>
          <p className={`text-xs font-medium ${isDone ? 'text-green-600' : status.includes('vencido') ? 'text-red-500' : 'text-gray-400'}`}>
            {status}
          </p>
        </div>
      </div>
      
      {canAction && (
        <button 
          onClick={onAction}
          className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 active:scale-90 transition-all"
        >
          <Camera className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
