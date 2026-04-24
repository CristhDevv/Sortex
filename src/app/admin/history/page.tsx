'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Users, TrendingUp, AlertCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function HistoryPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchVendors();
    // Default to last 7 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) fetchData();
  }, [startDate, endDate, vendorFilter]);

  const fetchVendors = async () => {
    const { data: vData } = await supabase.from('vendors').select('id, name');
    if (vData) setVendors(vData);
  };

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from('liquidations')
      .select('*, vendors(name, alias)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (vendorFilter !== 'all') {
      query = query.eq('vendor_id', vendorFilter);
    }

    const { data: lData, error } = await query;
    if (lData) setData(lData);
    setLoading(false);
  };

  const calculateTotals = () => {
    return data.reduce((sum, item) => sum + item.profit_cop, 0);
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Historial de Recaudos</h1>
          <p className="font-medium text-sm sm:text-base mt-1" style={{ color: 'var(--text-muted)' }}>Consulta liquidaciones pasadas y métricas de desempeño.</p>
        </div>
        
        <div 
          className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 p-4 sm:p-5 rounded-2xl border sm:items-end w-full lg:w-auto"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex-1 sm:flex-none">
            <label className="block text-[10px] font-black uppercase mb-2 tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Desde</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" 
              style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}            />
          </div>
          <div className="flex-1 sm:flex-none">
            <label className="block text-[10px] font-black uppercase mb-2 tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Hasta</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" 
              style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}            />
          </div>
          <div className="flex-1 sm:flex-none">
            <label className="block text-[10px] font-black uppercase mb-2 tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Vendedor</label>
            <select 
              value={vendorFilter} 
              onChange={e => setVendorFilter(e.target.value)} 
              className="w-full border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold appearance-none min-w-[200px]"
              style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
            >
              <option value="all">Todos los vendedores</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <StatCard 
          title="Total Recaudado" 
          value={`$${calculateTotals().toLocaleString()}`} 
          icon={<TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />} 
          bgColor="bg-indigo-500/10" 
          borderColor="border-indigo-500/20"
        />
        <StatCard 
          title="Ventas Realizadas" 
          value={data.length} 
          icon={<Search className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />} 
          bgColor="bg-amber-500/10" 
          borderColor="border-amber-500/20"
        />
        <StatCard 
          title="Promedio Diario" 
          value={`$${data.length ? Math.round(calculateTotals() / data.length).toLocaleString() : 0}`} 
          icon={<Users className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />} 
          bgColor="bg-emerald-500/10" 
          borderColor="border-emerald-500/20"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Analizando datos históricos...
        </div>
      ) : data.length === 0 ? (
        <div 
          className="text-center py-20 rounded-3xl border border-dashed"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <Calendar className="mx-auto mb-4" size={48} style={{ color: 'var(--border)' }} />
          <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>No hay registros en este periodo</p>
        </div>
      ) : (
        <div 
          className="rounded-2xl shadow-2xl border overflow-hidden"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="divide-y divide-[var(--border)]">
            {data.map((item) => (
              <div 
                key={item.id} 
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between transition-colors gap-4"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                
                <div className="flex items-center gap-4">
                  <div 
                    className="hidden sm:flex flex-col items-center justify-center p-2.5 rounded-xl border min-w-[4rem]"
                    style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{format(new Date(item.date + 'T12:00:00'), "MMM", { locale: es })}</span>
                    <span className="text-lg font-black leading-none mt-0.5" style={{ color: 'var(--text-primary)' }}>{format(new Date(item.date + 'T12:00:00'), "dd")}</span>
                  </div>

                  <div>
                    <div className="text-sm sm:text-base font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{item.vendors.name}</div>
                    <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>@{item.vendors.alias}</div>
                    
                    <div className="sm:hidden mt-1.5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(item.date + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                    </div>
                  </div>
                </div>

                <div 
                  className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0"
                  style={{ borderColor: 'var(--border-hover)' }} // subtle separator
                >
                  <div className="text-left sm:text-center">
                    <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Vendidas</div>
                    <div 
                      className="text-sm font-bold px-3 py-1 rounded-lg border"
                      style={{ background: 'var(--bg-page)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    >
                      {item.pieces_assigned - item.pieces_unsold} / <span style={{ color: 'var(--text-muted)' }}>{item.pieces_assigned}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Monto Recaudado</div>
                    <div className="text-base sm:text-xl font-black text-indigo-400">
                      ${item.profit_cop.toLocaleString()}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, bgColor, borderColor }: any) {
  return (
    <div 
      className="p-5 sm:p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-colors"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      <div className={`p-3 sm:p-4 ${bgColor} border ${borderColor} rounded-xl transition-colors flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>{title}</p>
        <p className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}
