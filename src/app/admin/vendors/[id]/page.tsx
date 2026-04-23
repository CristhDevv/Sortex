import { getVendorHistory } from '@/app/actions/analyticsActions';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  TrendingUp, 
  Package, 
  CheckCircle2, 
  Clock,
  History as HistoryIcon,
  Ticket,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PageProps {
  params: { id: string };
}

export default async function VendorDetailPage({ params }: PageProps) {
  const data = await getVendorHistory(params.id);

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center py-20 text-zinc-500">
        <AlertCircle className="w-12 h-12 mb-4 text-zinc-700" />
        <p className="font-black uppercase tracking-widest text-xs">Error al cargar datos del vendedor</p>
        <Link href="/admin/vendors" className="mt-6 text-indigo-400 hover:text-indigo-300 font-black flex items-center transition-colors bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Vendedores
        </Link>
      </div>
    );
  }

  const { vendor, history, totals } = data;

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link 
            href="/admin/vendors" 
            className="p-3 sm:p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex flex-wrap items-center gap-3">
              {vendor.name}
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${vendor.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                {vendor.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </h1>
            <p className="text-zinc-500 font-bold mt-1 flex items-center text-sm sm:text-base">
              <User className="w-4 h-4 mr-1.5 text-zinc-600" />
              @{vendor.alias}
            </p>
          </div>
        </div>
      </header>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <SummaryCard 
          title="Fracciones Asignadas" 
          value={totals.assigned} 
          icon={<Package className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />}
          bgColor="bg-indigo-500/10"
          borderColor="border-indigo-500/20"
        />
        <SummaryCard 
          title="Fracciones Vendidas" 
          value={totals.sold} 
          icon={<CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />}
          bgColor="bg-emerald-500/10"
          borderColor="border-emerald-500/20"
        />
        <SummaryCard 
          title="Fracciones Devueltas" 
          value={totals.unsold} 
          icon={<Clock className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400" />}
          bgColor="bg-rose-500/10"
          borderColor="border-rose-500/20"
        />
        <SummaryCard 
          title="Ganancia Generada" 
          value={`$${totals.profit.toLocaleString('es-CO')}`} 
          icon={<TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />}
          bgColor="bg-amber-500/10"
          borderColor="border-amber-500/20"
        />
      </div>

      {/* History List Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 sm:mb-8 pl-2">
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl shadow-sm">
            <HistoryIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">Historial Detallado</h2>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-zinc-800">
            {history.map((entry: any) => {
              const liq = entry.liquidations?.[0];
              const isLiquidated = !!liq;
              
              return (
                <div key={entry.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors">
                  
                  {/* Left: Date & Info */}
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-center justify-center bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 min-w-[4.5rem]">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{format(new Date(entry.date + 'T12:00:00'), "MMM", { locale: es })}</span>
                      <span className="text-lg font-black text-white leading-none mt-0.5">{format(new Date(entry.date + 'T12:00:00'), "dd")}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${entry.lotteries.draw_time === 'midday' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                          {entry.lotteries.draw_time === 'midday' ? 'Mediodía' : 'Noche'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${isLiquidated ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                          {isLiquidated ? 'Liquidado' : 'Pendiente'}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-white leading-tight">{entry.lotteries.name}</h3>
                      <div className="sm:hidden mt-1 text-[10px] font-bold text-zinc-500 uppercase">
                        {format(new Date(entry.date + 'T12:00:00'), "d 'de' MMM, yyyy", { locale: es })}
                      </div>
                    </div>
                  </div>

                  {/* Right: Stats */}
                  <div className="grid grid-cols-4 gap-4 sm:gap-8 w-full lg:w-auto items-end sm:items-center mt-2 lg:mt-0">
                    <div className="text-center">
                      <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Asig.</p>
                      <p className="text-xs sm:text-sm font-bold text-zinc-400">{entry.pieces_assigned}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Vend.</p>
                      <p className="text-xs sm:text-sm font-black text-emerald-400">{liq?.pieces_sold || '-'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Dev.</p>
                      <p className="text-xs sm:text-sm font-black text-rose-400">{liq?.pieces_unsold || '-'}</p>
                    </div>
                    <div className="text-right sm:text-center min-w-[5rem]">
                      <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Ganancia</p>
                      <p className="text-sm sm:text-base font-black text-white">
                        {isLiquidated ? `$${liq.profit_cop.toLocaleString('es-CO')}` : '-'}
                      </p>
                    </div>
                  </div>

                </div>
              );
            })}
            
            {history.length === 0 && (
              <div className="p-12 sm:py-20 text-center">
                <HistoryIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-500 font-bold text-sm">
                  No hay historial de asignaciones para este vendedor.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, bgColor, borderColor }: any) {
  return (
    <div className="bg-zinc-900 p-5 sm:p-6 rounded-2xl border border-zinc-800 flex items-center gap-4 hover:border-zinc-700 transition-colors">
      <div className={`p-3 sm:p-4 ${bgColor} border ${borderColor} rounded-xl transition-colors flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-500 mb-0.5">{title}</p>
        <p className="text-2xl sm:text-3xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}
