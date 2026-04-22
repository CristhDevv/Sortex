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
    return data.reduce((sum, item) => sum + item.amount_due_cop, 0);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Historial de Recaudos</h1>
          <p className="text-gray-500">Consulta liquidaciones pasadas y métricas de desempeño.</p>
        </div>
        
        <div className="flex space-x-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-end">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Desde</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border-none p-0 focus:ring-0 text-sm font-bold" />
          </div>
          <div className="border-l border-gray-100 pl-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Hasta</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border-none p-0 focus:ring-0 text-sm font-bold" />
          </div>
          <div className="border-l border-gray-100 pl-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Vendedor</label>
            <select value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} className="border-none p-0 focus:ring-0 text-sm font-bold bg-transparent">
              <option value="all">Todos</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Recaudado" value={`$${calculateTotals().toLocaleString()}`} icon={<TrendingUp className="w-8 h-8 text-indigo-600" />} bgColor="bg-indigo-50" />
        <StatCard title="Ventas Realizadas" value={data.length} icon={<Search className="w-8 h-8 text-amber-600" />} bgColor="bg-amber-50" />
        <StatCard title="Promedio Diario" value={`$${data.length ? Math.round(calculateTotals() / data.length).toLocaleString() : 0}`} icon={<Users className="w-8 h-8 text-green-600" />} bgColor="bg-green-50" />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Analizando datos históricos...</div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Vendedor</th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Vendidas</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-gray-600 uppercase">
                    {format(new Date(item.date + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{item.vendors.name}</div>
                    <div className="text-xs text-gray-500">@{item.vendors.alias}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {item.total_tickets - item.unsold_tickets} / {item.total_tickets}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-indigo-600">
                    ${item.amount_due_cop.toLocaleString()}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-400 italic">No hay registros en este periodo</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, bgColor }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-6">
      <div className={`p-4 ${bgColor} rounded-2xl`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}
