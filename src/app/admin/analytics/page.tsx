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
    { id: 'lottery', label: 'Lotería', icon: <Layout className="w-4 h-4" /> },
    { id: 'day', label: 'Día', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'vendor', label: 'Vendedor', icon: <Users className="w-4 h-4" /> },
    { id: 'jornada', label: 'Jornada', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-zinc-950 min-h-screen pb-12">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Análisis de Ganancias</h1>
          <p className="text-zinc-500 font-medium text-sm sm:text-base mt-1">Monitorea el rendimiento financiero del sistema.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-zinc-900 p-4 sm:p-2 rounded-2xl border border-zinc-800 shadow-sm w-full lg:w-auto">
          <div className="flex items-center px-4 py-2 sm:py-1.5 bg-zinc-800 rounded-xl border border-zinc-700 w-full sm:w-auto">
            <CalendarIcon className="w-4 h-4 text-zinc-500 mr-2 flex-shrink-0" />
            <input 
              type="date" 
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="bg-transparent border-none text-sm font-bold text-white focus:ring-0 p-0 w-full outline-none"
            />
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 hidden sm:block flex-shrink-0" />
          <div className="flex items-center px-4 py-2 sm:py-1.5 bg-zinc-800 rounded-xl border border-zinc-700 w-full sm:w-auto">
            <CalendarIcon className="w-4 h-4 text-zinc-500 mr-2 flex-shrink-0" />
            <input 
              type="date" 
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="bg-transparent border-none text-sm font-bold text-white focus:ring-0 p-0 w-full outline-none"
            />
          </div>
        </div>
      </header>

      {/* Summary Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
        <div className="relative z-10 w-full text-center md:text-left">
          <p className="text-zinc-500 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2">Ganancia Total del Periodo</p>
          <h2 className="text-4xl sm:text-6xl font-black tabular-nums text-white">
            ${totalProfit.toLocaleString('es-CO')}
          </h2>
          <div className="flex items-center justify-center md:justify-start mt-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold w-fit mx-auto md:mx-0 px-4 py-2 rounded-xl text-xs sm:text-sm tracking-wide">
            <TrendingUp className="w-4 h-4 mr-2" />
            {data.length} registros analizados
          </div>
        </div>
        <div className="hidden md:block relative z-10">
          <div className="p-6 bg-zinc-800/50 backdrop-blur-md rounded-2xl border border-zinc-700">
            <BarChart3 className="w-16 h-16 text-indigo-400 opacity-80" />
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl w-full sm:w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all uppercase tracking-wider
              ${activeTab === tab.id 
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' 
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}
            `}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Data Section */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-zinc-900 rounded-3xl border border-zinc-800">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest animate-pulse">Cargando análisis...</p>
          </div>
        ) : data.length > 0 ? (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/50">
                    <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Detalle</th>
                    <th className="text-right px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ganancia (COP)</th>
                    <th className="text-right px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">% del Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {data.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-5 font-black text-white text-sm sm:text-base">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${idx % 2 === 0 ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
                          <span className="truncate">
                            {activeTab === 'day' ? format(new Date(item.label + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es }) : item.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-white tabular-nums text-sm sm:text-base">
                        ${item.value.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-5 text-right w-1/3 sm:w-1/4">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2 sm:gap-4">
                          <span className="text-[10px] sm:text-xs font-black text-zinc-500 tabular-nums">
                            {((item.value / totalProfit) * 100).toFixed(1)}%
                          </span>
                          <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${idx % 2 === 0 ? 'bg-indigo-400' : 'bg-emerald-400'}`}
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
          <div className="h-64 flex flex-col items-center justify-center bg-zinc-900 rounded-3xl border border-zinc-800 border-dashed text-zinc-500">
            <TrendingDown className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold uppercase text-[10px] tracking-widest">No hay datos para este periodo</p>
          </div>
        )}
      </div>
    </div>
  );
}
