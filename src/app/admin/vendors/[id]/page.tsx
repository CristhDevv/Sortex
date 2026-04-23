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
  DollarSign
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
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="font-bold uppercase tracking-widest text-xs">Error al cargar datos del vendedor</p>
        <Link href="/admin/vendors" className="mt-4 text-indigo-600 font-bold flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Vendedores
        </Link>
      </div>
    );
  }

  const { vendor, history, totals } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/vendors" 
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              {vendor.name}
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${vendor.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {vendor.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </h1>
            <p className="text-gray-500 font-medium mt-1 flex items-center">
              <User className="w-4 h-4 mr-1 text-gray-400" />
              @{vendor.alias}
            </p>
          </div>
        </div>
      </header>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Fracciones Asignadas" 
          value={totals.assigned} 
          icon={<Package className="w-8 h-8 text-indigo-600" />}
          bgColor="bg-indigo-50"
        />
        <SummaryCard 
          title="Fracciones Vendidas" 
          value={totals.sold} 
          icon={<CheckCircle2 className="w-8 h-8 text-emerald-600" />}
          bgColor="bg-emerald-50"
        />
        <SummaryCard 
          title="Fracciones Devueltas" 
          value={totals.unsold} 
          icon={<Clock className="w-8 h-8 text-rose-600" />}
          bgColor="bg-rose-50"
        />
        <SummaryCard 
          title="Ganancia Generada" 
          value={`$${totals.profit.toLocaleString('es-CO')}`} 
          icon={<TrendingUp className="w-8 h-8 text-amber-600" />}
          bgColor="bg-amber-50"
        />
      </div>

      {/* History Table Section */}
      <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-white rounded-2xl shadow-sm">
            <HistoryIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Historial Detallado</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                <th className="text-left pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lotería</th>
                <th className="text-left pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Jornada</th>
                <th className="text-right pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Asig.</th>
                <th className="text-right pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vend.</th>
                <th className="text-right pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dev.</th>
                <th className="text-right pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ganancia</th>
                <th className="text-center pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((entry: any) => {
                const liq = entry.liquidations?.[0];
                const isLiquidated = !!liq;
                
                return (
                  <tr key={entry.id} className="group hover:bg-white/50 transition-colors">
                    <td className="py-5 font-bold text-gray-700">
                      {format(new Date(entry.date + 'T12:00:00'), "d 'de' MMM, yyyy", { locale: es })}
                    </td>
                    <td className="py-5 font-bold text-gray-900">{entry.lotteries.name}</td>
                    <td className="py-5">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${entry.lotteries.draw_time === 'midday' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-800 text-white'}`}>
                        {entry.lotteries.draw_time === 'midday' ? 'Mediodía' : 'Noche'}
                      </span>
                    </td>
                    <td className="py-5 text-right font-medium text-gray-500">{entry.pieces_assigned}</td>
                    <td className="py-5 text-right font-black text-emerald-600">{liq?.pieces_sold || '-'}</td>
                    <td className="py-5 text-right font-medium text-rose-500">{liq?.pieces_unsold || '-'}</td>
                    <td className="py-5 text-right font-black text-gray-900 tabular-nums">
                      {isLiquidated ? `$${liq.profit_cop.toLocaleString('es-CO')}` : '-'}
                    </td>
                    <td className="py-5 text-center">
                      {isLiquidated ? (
                        <div className="inline-flex items-center text-emerald-600 font-black text-[10px] uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Liquidado
                        </div>
                      ) : (
                        <div className="inline-flex items-center text-amber-600 font-black text-[10px] uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendiente
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-gray-400 font-medium">
                    No hay historial de asignaciones para este vendedor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, bgColor }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
      <div className={`p-4 ${bgColor} rounded-2xl transition-all duration-500`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{title}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}
