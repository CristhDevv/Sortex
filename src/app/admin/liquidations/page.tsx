'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLiquidationsByDate } from '@/app/actions/liquidationActions';
import {
  FileText,
  Table as TableIcon,
  Calculator,
  User,
  Ticket,
  Loader2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

function LiquidationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    const liquidations = await getLiquidationsByDate(selectedDate);
    setData(liquidations);
    setLoading(false);
  };

  const getFlatAssignments = () => {
    const flat: any[] = [];
    data.forEach((group: any) => {
      group.assignments.forEach((asg: any) => {
        flat.push({ vendor: group.vendor, asg });
      });
    });
    return flat;
  };

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    doc.text(`Resumen de Liquidación - ${selectedDate}`, 14, 15);

    const flat = getFlatAssignments();
    const tableData = flat.map(({ vendor, asg }) => {
      const liq = asg.liquidations?.[0];
      return [
        vendor?.name || '',
        asg.lotteries?.name || '',
        asg.pieces_assigned,
        liq?.pieces_sold ?? 'Pend.',
        liq?.pieces_unsold ?? 'Pend.',
        liq ? `$${liq.profit_cop.toLocaleString()}` : 'Pend. Revisión',
      ];
    });

    doc.autoTable({
      head: [['Vendedor', 'Lotería', 'Asignadas', 'Vendidas', 'Devueltas', 'Utilidad']],
      body: tableData,
      startY: 20,
    });

    doc.save(`Liquidacion_${selectedDate}.pdf`);
  };

  const exportExcel = () => {
    const flat = getFlatAssignments();
    const tableData = flat.map(({ vendor, asg }) => {
      const liq = asg.liquidations?.[0];
      return {
        Vendedor: vendor?.name,
        Lotería: asg.lotteries?.name,
        Asignadas: asg.pieces_assigned,
        Devueltas: liq?.pieces_unsold ?? 'Pendiente',
        Vendidas: liq?.pieces_sold ?? 'Pendiente',
        'Utilidad (COP)': liq?.profit_cop ?? 0,
      };
    });

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Liquidaciones');
    XLSX.writeFile(wb, `Liquidacion_${selectedDate}.xlsx`);
  };

  const calculateTotal = () =>
    data.reduce((sum, group) => 
      sum + group.assignments.reduce((gSum: number, asg: any) => gSum + (asg.liquidations?.[0]?.profit_cop || 0), 0)
    , 0);

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6" style={{ background: 'var(--bg-page)' }}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Liquidaciones
          </h1>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-2 block px-4 py-2 border rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-fit"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center justify-center flex-1 sm:flex-none px-4 py-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 text-xs tracking-widest font-black uppercase active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4 mr-2" /> PDF
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center justify-center flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 text-xs tracking-widest font-black uppercase active:scale-95 transition-all"
          >
            <TableIcon className="w-4 h-4 mr-2" /> EXCEL
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 shadow-xl shadow-indigo-500/5">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
            Utilidad Total del Día
          </p>
          <p className="text-4xl font-black text-indigo-400">${calculateTotal().toLocaleString()}</p>
        </div>

        {loading ? (
          <div
            className="text-center py-12 animate-pulse text-sm font-bold tracking-widest uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            Procesando datos...
          </div>
        ) : data.length === 0 ? (
          <div
            className="text-center py-16 rounded-3xl border border-dashed"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <Calculator className="mx-auto mb-4" size={48} style={{ color: 'var(--border)' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>
              No hay asignaciones para liquidar en esta fecha
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {data.map((group: any, groupIdx: number) => {
              // Verificar si TODAS las asignaciones de este grupo ya están liquidadas
              const allLiquidated = group.assignments.length > 0 && group.assignments.every((asg: any) => asg.liquidations?.[0]?.profit_cop != null);
              
              return (
                <div 
                  key={groupIdx}
                  className="rounded-2xl overflow-hidden shadow-2xl border"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  {/* Header Vendedor */}
                  <div className="p-4 border-b flex items-center gap-4 bg-indigo-500/5" style={{ borderColor: 'var(--border)' }}>
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                      <User className="text-indigo-400" size={20} />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{group.vendor?.name}</div>
                      <div className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>@{group.vendor?.alias}</div>
                    </div>
                  </div>

                  {/* Filas de Asignaciones */}
                  <div className="divide-y divide-[var(--border)]">
                    {group.assignments.map((asg: any) => {
                      const liq = asg.liquidations?.[0];
                      const isMidday = asg.lotteries?.draw_time === 'midday';

                      return (
                        <div 
                          key={asg.id} 
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between transition-colors hover:bg-[var(--bg-card-hover)] gap-4"
                        >
                          <div className="flex-1">
                            <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Lotería</div>
                            <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                              <Ticket size={14} style={{ color: 'var(--text-muted)' }} />
                              {asg.lotteries?.name}
                            </div>
                          </div>

                          <div className="w-24 text-center">
                            <span className={`px-2.5 py-1 inline-flex text-[10px] uppercase tracking-widest font-black rounded-lg ${
                              isMidday ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {isMidday ? 'Día' : 'Noche'}
                            </span>
                          </div>
                          
                          <div className="w-24 text-center">
                            <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Frac.</div>
                            <div className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{asg.pieces_assigned}</div>
                          </div>

                          <div className="w-24 text-right sm:text-center">
                            <span className={`px-2 py-0.5 inline-flex text-[9px] uppercase tracking-widest font-black rounded-lg ${
                              liq ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {liq ? 'Revisado' : 'Pendiente'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Button - Consolidado */}
                  <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                      onClick={() => router.push(`/admin/liquidations/${group.vendor.id}?date=${selectedDate}`)}
                      className={`w-full flex items-center justify-center p-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        allLiquidated
                          ? 'border bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border-[var(--border-hover)]'
                          : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'
                      }`}
                    >
                      <Calculator size={16} className="mr-2" />
                      {allLiquidated ? 'Revisar Consolidado' : 'Liquidar Vendedor'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiquidationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[200px]" style={{ background: 'var(--bg-page)' }}>
        <Loader2 className="animate-spin text-indigo-400" size={28} />
      </div>
    }>
      <LiquidationsContent />
    </Suspense>
  );
}
