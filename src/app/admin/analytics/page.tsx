'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Users, 
  Layout, 
  Clock,
  ArrowRight,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  getProfitByLottery, 
  getProfitByDay, 
  getProfitByVendor, 
  getProfitByJornada 
} from '@/app/actions/analyticsActions';

type AnalyticsData = {
  label: string;
  value: number;
};

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'lottery' | 'day' | 'vendor' | 'jornada'>('lottery');
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    let result: AnalyticsData[] = [];
    
    try {
      switch (activeTab) {
        case 'lottery':
          result = await getProfitByLottery(dateRange.from, dateRange.to);
          break;
        case 'day':
          result = await getProfitByDay(dateRange.from, dateRange.to);
          break;
        case 'vendor':
          result = await getProfitByVendor(dateRange.from, dateRange.to);
          break;
        case 'jornada':
          result = await getProfitByJornada(dateRange.from, dateRange.to);
          break;
      }
      
      setData(result);
      setTotalProfit(result.reduce((sum, item) => sum + item.value, 0));
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'lottery', label: 'Por Lotería', icon: <Layout className="w-4 h-4" /> },
    { id: 'day', label: 'Por Día', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'vendor', label: 'Por Vendedor', icon: <Users className="w-4 h-4" /> },
    { id: 'jornada', label: 'Por Jornada', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Análisis de Ganancias</h1>
          <p className="text-gray-500 font-medium mt-1">Monitorea el rendimiento financiero del sistema.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center px-4 py-2 bg-gray-50 rounded-[1.5rem]">
            <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
            <input 
              type="date" 
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 p-0"
            />
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <div className="flex items-center px-4 py-2 bg-gray-50 rounded-[1.5rem]">
            <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
            <input 
              type="date" 
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 p-0"
            />
          </div>
        </div>
      </header>

      {/* Summary Card */}
      <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-gray-200 overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Ganancia Total Periodo</p>
          <h2 className="text-6xl font-black tabular-nums">
            ${totalProfit.toLocaleString('es-CO')}
          </h2>
          <div className="flex items-center mt-4 text-emerald-400 font-bold bg-emerald-400/10 w-fit px-3 py-1 rounded-full text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            {data.length} registros encontrados
          </div>
        </div>
        <div className="mt-8 md:mt-0 relative z-10">
          <div className="p-6 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/10">
            <BarChart3 className="w-12 h-12 text-white opacity-80" />
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-gray-100/50 p-1.5 rounded-[2rem] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-sm font-bold transition-all
              ${activeTab === tab.id 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Data Section */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Cargando análisis...</p>
            </div>
          </div>
        ) : data.length > 0 ? (
          <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalle</th>
                    <th className="text-right pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ganancia (COP)</th>
                    <th className="text-right pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">% del Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-white/50 transition-colors">
                      <td className="py-5 font-bold text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${idx % 2 === 0 ? 'bg-indigo-500' : 'bg-rose-500'}`}></div>
                          {activeTab === 'day' ? format(new Date(item.label + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es }) : item.label}
                        </div>
                      </td>
                      <td className="py-5 text-right font-black text-gray-900 tabular-nums">
                        ${item.value.toLocaleString('es-CO')}
                      </td>
                      <td className="py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-xs font-bold text-gray-500">
                            {((item.value / totalProfit) * 100).toFixed(1)}%
                          </span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${idx % 2 === 0 ? 'bg-indigo-500' : 'bg-rose-500'}`}
                              style={{ width: `${(item.value / totalProfit) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-gray-400">
            <TrendingDown className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold uppercase text-[10px] tracking-widest">No hay datos para este periodo</p>
          </div>
        )}
      </div>
    </div>
  );
}
