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
      <div className="min-h-screen flex flex-col items-center justify-center py-20" style={{ background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
        <AlertCircle className="w-12 h-12 mb-4" style={{ color: 'var(--border)' }} />
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
    <div className="min-h-screen p-4 sm:p-6 space-y-6 sm:space-y-8 pb-12" style={{ background: 'var(--bg-page)' }}>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link 
            href="/admin/vendors" 
            className="p-3 sm:p-4 rounded-xl border transition-colors shadow-sm"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card)' }}
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'var(--text-secondary)' }} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex flex-wrap items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              {vendor.name}
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${vendor.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                {vendor.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </h1>
            <p className="font-bold mt-1 flex items-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
              <User className="w-4 h-4 mr-1.5" style={{ color: 'var(--text-decorative)' }} />
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
      <div 
        className="rounded-3xl p-4 sm:p-8 shadow-2xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3 mb-6 sm:mb-8 pl-2">
          <div 
            className="p-3 border rounded-xl shadow-sm"
            style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}
          >
            <HistoryIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-black" style={{ color: 'var(--text-primary)' }}>Historial Detallado</h2>
        </div>

        <div 
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}
        >
          <div className="divide-y divide-[var(--border)]">
            {history.map((entry: any) => {
              const liq = entry.liquidations?.[0];
              const isLiquidated = !!liq;
              
              return (
                <div 
                  key={entry.id} 
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  
                  {/* Left: Date & Info */}
                  <div className="flex items-center gap-4">
                    <div 
                      className="hidden sm:flex flex-col items-center justify-center p-2.5 rounded-xl border min-w-[4.5rem]"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{format(new Date(entry.date + 'T12:00:00'), "MMM", { locale: es })}</span>
                      <span className="text-lg font-black leading-none mt-0.5" style={{ color: 'var(--text-primary)' }}>{format(new Date(entry.date + 'T12:00:00'), "dd")}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${entry.lotteries.draw_time === 'midday' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                          {entry.lotteries.draw_time === 'midday' ? 'Mediodía' : 'Noche'}
                        </span>
                        <span 
                          className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                            isLiquidated 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'border-[var(--border-hover)]'
                          }`}
                          style={isLiquidated ? {} : { background: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}
                        >
                          {isLiquidated ? 'Liquidado' : 'Pendiente'}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{entry.lotteries.name}</h3>
                      <div className="sm:hidden mt-1 text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                        {format(new Date(entry.date + 'T12:00:00'), "d 'de' MMM, yyyy", { locale: es })}
                      </div>
                    </div>
                  </div>

                  {/* Right: Stats */}
                  <div className="grid grid-cols-4 gap-4 sm:gap-8 w-full lg:w-auto items-end sm:items-center mt-2 lg:mt-0">
                    <div className="text-center">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Asig.</p>
                      <p className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{entry.pieces_assigned}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Vend.</p>
                      <p className="text-xs sm:text-sm font-black text-emerald-400">{liq?.pieces_sold || '-'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Dev.</p>
                      <p className="text-xs sm:text-sm font-black text-rose-400">{liq?.pieces_unsold || '-'}</p>
                    </div>
                    <div className="text-right sm:text-center min-w-[5rem]">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Ganancia</p>
                      <p className="text-sm sm:text-base font-black" style={{ color: 'var(--text-primary)' }}>
                        {isLiquidated ? `$${liq.profit_cop.toLocaleString('es-CO')}` : '-'}
                      </p>
                    </div>
                  </div>

                </div>
              );
            })}
            
            {history.length === 0 && (
              <div className="p-12 sm:py-20 text-center">
                <HistoryIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--border)' }} />
                <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>
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
    <div 
      className="p-5 sm:p-6 rounded-2xl border flex items-center gap-4 transition-colors"
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
