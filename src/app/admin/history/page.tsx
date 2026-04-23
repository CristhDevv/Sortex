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
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-zinc-950 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Historial de Recaudos</h1>
          <p className="text-zinc-500 font-medium text-sm sm:text-base mt-1">Consulta liquidaciones pasadas y métricas de desempeño.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-800 sm:items-end w-full lg:w-auto">
          <div className="flex-1 sm:flex-none">
            <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest ml-1">Desde</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" 
            />
          </div>
          <div className="flex-1 sm:flex-none">
            <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest ml-1">Hasta</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" 
            />
          </div>
          <div className="flex-1 sm:flex-none">
            <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest ml-1">Vendedor</label>
            <select 
              value={vendorFilter} 
              onChange={e => setVendorFilter(e.target.value)} 
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold appearance-none min-w-[200px]"
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
        <div className="text-center py-20 text-zinc-500 animate-pulse text-sm font-bold tracking-widest uppercase">
          Analizando datos históricos...
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900 rounded-3xl border border-zinc-800 border-dashed">
          <Calendar className="mx-auto text-zinc-700 mb-4" size={48} />
          <p className="text-zinc-500 font-bold text-sm">No hay registros en este periodo</p>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden">
          <div className="divide-y divide-zinc-800">
            {data.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-800/50 transition-colors gap-4">
                
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-center justify-center bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 min-w-[4rem]">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{format(new Date(item.date + 'T12:00:00'), "MMM", { locale: es })}</span>
                    <span className="text-lg font-black text-white leading-none mt-0.5">{format(new Date(item.date + 'T12:00:00'), "dd")}</span>
                  </div>

                  <div>
                    <div className="text-sm sm:text-base font-black text-white leading-tight">{item.vendors.name}</div>
                    <div className="text-xs font-bold text-zinc-500 mt-0.5">@{item.vendors.alias}</div>
                    
                    <div className="sm:hidden mt-1.5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      {format(new Date(item.date + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 w-full sm:w-auto border-t border-zinc-800/50 sm:border-0 pt-3 sm:pt-0">
                  <div className="text-left sm:text-center">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Vendidas</div>
                    <div className="text-sm font-bold text-white bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                      {item.pieces_assigned - item.pieces_unsold} / <span className="text-zinc-500">{item.pieces_assigned}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Monto Recaudado</div>
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
    <div className="bg-zinc-900 p-5 sm:p-6 rounded-2xl border border-zinc-800 shadow-sm flex items-center gap-4 hover:border-zinc-700 transition-colors">
      <div className={`p-3 sm:p-4 ${bgColor} border ${borderColor} rounded-xl transition-colors flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] sm:text-xs font-black uppercase text-zinc-500 tracking-widest mb-0.5">{title}</p>
        <p className="text-2xl sm:text-3xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}
