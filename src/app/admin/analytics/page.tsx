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
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 min-h-screen pb-12" style={{ background: 'var(--bg-page)' }}>
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Análisis de Ganancias</h1>
          <p className="font-medium text-sm sm:text-base mt-1" style={{ color: 'var(--text-muted)' }}>Monitorea el rendimiento financiero del sistema.</p>
        </div>

        <div 
          className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-4 sm:p-2 rounded-2xl border shadow-sm w-full lg:w-auto"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div 
            className="flex items-center px-4 py-2 sm:py-1.5 rounded-xl border w-full sm:w-auto"
            style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)' }}
          >
            <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <input 
              type="date" 
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="bg-transparent border-none text-sm font-bold focus:ring-0 p-0 w-full outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
          <ArrowRight className="w-4 h-4 hidden sm:block flex-shrink-0" style={{ color: 'var(--text-decorative)' }} />
          <div 
            className="flex items-center px-4 py-2 sm:py-1.5 rounded-xl border w-full sm:w-auto"
            style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)' }}
          >
            <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <input 
              type="date" 
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="bg-transparent border-none text-sm font-bold focus:ring-0 p-0 w-full outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </header>

      {/* Summary Card */}
      <div 
        className="rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
      >
        <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Ganancia Total del Periodo</p>
          <h2 className="text-4xl sm:text-6xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
            ${totalProfit.toLocaleString('es-CO')}
          </h2>
          <div className="flex items-center justify-center md:justify-start mt-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold w-fit mx-auto md:mx-0 px-4 py-2 rounded-xl text-xs sm:text-sm tracking-wide">
            <TrendingUp className="w-4 h-4 mr-2" />
            {data.length} registros analizados
          </div>
        </div>
        <div className="hidden md:block relative z-10">
          <div 
            className="p-6 backdrop-blur-md rounded-2xl border"
            style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)' }}
          >
            <BarChart3 className="w-16 h-16 text-indigo-400 opacity-80" />
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
      </div>

      {/* Tabs */}
      <div 
        className="flex flex-wrap gap-2 p-1.5 rounded-2xl w-full sm:w-fit border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
              ? 'shadow-sm border' 
              : 'border border-transparent'
            }`}
            style={activeTab === tab.id ? { background: 'var(--bg-card-hover)', color: 'var(--text-primary)', borderColor: 'var(--border-hover)' } : { color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { if(activeTab !== tab.id) e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={(e) => { if(activeTab !== tab.id) e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Data Section */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div 
            className="h-64 flex flex-col items-center justify-center rounded-3xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold uppercase text-[10px] tracking-widest animate-pulse" style={{ color: 'var(--text-muted)' }}>Cargando análisis...</p>
          </div>
        ) : data.length > 0 ? (
          <div 
            className="rounded-2xl border overflow-hidden shadow-xl"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: 'var(--bg-page)' }}>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Detalle</th>
                    <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Ganancia (COP)</th>
                    <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>% del Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.map((item, idx) => (
                    <tr 
                      key={idx} 
                      className="group transition-colors"
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <td className="px-6 py-5 font-black text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${idx % 2 === 0 ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
                          <span className="truncate">
                            {activeTab === 'day' ? format(new Date(item.label + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es }) : item.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-black tabular-nums text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                        ${item.value.toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-5 text-right w-1/3 sm:w-1/4">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2 sm:gap-4">
                          <span className="text-[10px] sm:text-xs font-black tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            {((item.value / totalProfit) * 100).toFixed(1)}%
                          </span>
                          <div 
                            className="w-16 sm:w-24 h-1.5 sm:h-2 rounded-full overflow-hidden"
                            style={{ background: 'var(--bg-page)' }}
                          >
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
          <div 
            className="h-64 flex flex-col items-center justify-center rounded-3xl border border-dashed"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <TrendingDown className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold uppercase text-[10px] tracking-widest">No hay datos para este periodo</p>
          </div>
        )}
      </div>
    </div>
  );
}
