'use client';

import { useEffect, useState } from 'react';
import { getLiquidationsByDate, processLiquidation } from '@/app/actions/liquidationActions';
import { getSignedPhotoUrl } from '@/app/actions/reportActions';
import { 
  FileText, 
  Table as TableIcon, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  Calculator,
  User,
  Ticket,
  Circle
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function LiquidationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Review state
  const [reviewing, setReviewing] = useState<any>(null);
  const [unsold, setUnsold] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    const liquidations = await getLiquidationsByDate(selectedDate);
    setData(liquidations);
    setLoading(false);
  };

  const handleReview = async (item: any) => {
    setReviewing(item);
    setUnsold(item.liquidations?.[0]?.pieces_unsold || 0);
    
    // Get photo for review (prefer night report if exists)
    const report = item.reports?.find((r: any) => r.report_type === 'night') || 
                   item.reports?.find((r: any) => r.report_type === 'midday');
    
    if (report?.photo_url) {
      const url = await getSignedPhotoUrl(report.photo_url);
      setPhotoUrl(url);
    } else {
      setPhotoUrl(null);
    }
  };

  const confirmLiquidation = async () => {
    const result = await processLiquidation({
      assignment_id: reviewing.id,
      vendor_id: reviewing.vendor_id,
      date: selectedDate,
      pieces_assigned: reviewing.pieces_assigned,
      pieces_unsold: unsold,
      piece_profit_cop: reviewing.lotteries.piece_profit_cop,
    });

    if (result.success) {
      setReviewing(null);
      fetchData();
    } else {
      alert('Error al liquidar: ' + result.error);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    doc.text(`Resumen de Liquidación - ${selectedDate}`, 14, 15);
    
    const tableData = data.map(item => {
      const liq = item.liquidations?.[0];
      return [
        item.vendors?.name || '',
        item.lotteries?.name || '',
        item.pieces_assigned,
        liq?.pieces_sold ?? 'Pend.',
        liq?.pieces_unsold ?? 'Pend.',
        liq ? `$${liq.profit_cop.toLocaleString()}` : 'Pend. Revisión'
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
    const tableData = data.map(item => {
      const liq = item.liquidations?.[0];
      return {
        'Vendedor': item.vendors?.name,
        'Lotería': item.lotteries?.name,
        'Asignadas': item.pieces_assigned,
        'Devueltas': liq?.pieces_unsold ?? 'Pendiente',
        'Vendidas': liq?.pieces_sold ?? 'Pendiente',
        'Utilidad (COP)': liq?.profit_cop ?? 0
      };
    });

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Liquidaciones');
    XLSX.writeFile(wb, `Liquidacion_${selectedDate}.xlsx`);
  };

  const calculateTotal = () => {
    return data.reduce((sum, item) => sum + (item.liquidations?.[0]?.profit_cop || 0), 0);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Liquidaciones</h1>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-2 block px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-bold text-zinc-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-fit"
          />
        </div>
        
        <div className="flex gap-3">
          <button onClick={exportPDF} className="flex items-center justify-center flex-1 sm:flex-none px-4 py-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 text-xs tracking-widest font-black uppercase active:scale-95 transition-all">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </button>
          <button onClick={exportExcel} className="flex items-center justify-center flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 text-xs tracking-widest font-black uppercase active:scale-95 transition-all">
            <TableIcon className="w-4 h-4 mr-2" /> EXCEL
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/5">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Utilidad Total del Día</p>
          <p className="text-4xl font-black text-indigo-400">${calculateTotal().toLocaleString()}</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-500 animate-pulse text-sm font-bold tracking-widest uppercase">
            Procesando datos...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 rounded-3xl border border-zinc-800 border-dashed">
            <Calculator className="mx-auto text-zinc-700 mb-4" size={48} />
            <p className="text-zinc-500 font-bold text-sm">No hay asignaciones para liquidar en esta fecha</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="divide-y divide-zinc-800">
              {data.map((item) => {
                const liq = item.liquidations?.[0];
                const isMidday = item.lotteries?.draw_time === 'midday';

                return (
                  <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-800/50 transition-colors group gap-4">
                    {/* Info Block */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0 border border-zinc-700">
                        <User className="text-zinc-400" size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-black text-white leading-tight">{item.vendors?.name}</h3>
                          <span className={`px-2 py-0.5 inline-flex text-[9px] uppercase tracking-widest font-black rounded-lg ${
                            liq 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {liq ? 'Liquidado' : 'Pendiente'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 mt-0.5">@{item.vendors?.alias}</p>
                      </div>
                    </div>

                    {/* Details Block */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 w-full sm:w-auto">
                      {/* Lottery */}
                      <div className="hidden sm:block">
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Lotería</div>
                        <div className="text-sm font-bold text-zinc-300 flex items-center gap-1.5">
                          <Ticket size={14} className="text-zinc-500" />
                          {item.lotteries?.name}
                        </div>
                      </div>

                      {/* Turno */}
                      <span className={`px-2.5 py-1 inline-flex text-[10px] uppercase tracking-widest font-black rounded-lg ${
                        isMidday 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {isMidday ? 'Día' : 'Noche'}
                      </span>

                      {/* Utility calculated */}
                      <div className="text-right sm:text-center min-w-[5rem]">
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Utilidad</div>
                        {liq ? (
                          <div className="text-sm font-black text-white">${liq.profit_cop.toLocaleString()}</div>
                        ) : (
                          <div className="text-sm font-bold text-zinc-600">---</div>
                        )}
                      </div>

                      {/* Action */}
                      <button 
                        onClick={() => handleReview(item)}
                        className={`flex items-center justify-center p-2.5 sm:px-4 sm:py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          liq
                            ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                            : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'
                        }`}
                      >
                        <Calculator size={16} className="sm:mr-2" />
                        <span className="hidden sm:inline">{liq ? 'Revisar' : 'Liquidar'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Liquidación: {reviewing.vendors?.name}</h2>
                <p className="text-zinc-500 font-bold text-xs sm:text-sm mt-1">{reviewing.lotteries?.name} - {reviewing.lotteries?.draw_time === 'midday' ? 'Mediodía' : 'Noche'}</p>
              </div>
              <button onClick={() => setReviewing(null)} className="text-zinc-500 hover:text-white transition-colors p-1">
                <XCircle size={28} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase mb-4 tracking-widest">Evidencia Fotográfica</p>
                {photoUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center h-64 sm:h-auto">
                    <img src={photoUrl} alt="Reporte" className="w-full h-full object-contain sm:h-auto" />
                  </div>
                ) : (
                  <div className="aspect-[3/4] sm:aspect-auto sm:h-64 bg-zinc-950 border border-zinc-800 border-dashed rounded-2xl flex flex-col items-center justify-center text-zinc-700">
                    <Eye className="w-12 h-12 sm:w-16 sm:h-16 mb-4 text-zinc-800" />
                    <p className="text-sm font-bold uppercase tracking-widest text-zinc-600">Sin foto disponible</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-6 sm:space-y-8 flex flex-col justify-center">
                <div className="bg-zinc-950 p-6 rounded-2xl space-y-4 border border-zinc-800">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-black uppercase tracking-widest text-[10px] sm:text-xs">Fracciones Asignadas</span>
                    <span className="font-black text-xl text-white">{reviewing.pieces_assigned}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                    <span className="text-zinc-500 font-black uppercase tracking-widest text-[10px] sm:text-xs">Utilidad x Fracción</span>
                    <span className="font-black text-xl text-indigo-400">${reviewing.lotteries?.piece_profit_cop.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase mb-3 tracking-widest ml-1">
                    Devueltas (No vendidas)
                  </label>
                  <input
                    type="number"
                    value={unsold}
                    onChange={(e) => setUnsold(Math.max(0, parseInt(e.target.value) || 0))}
                    max={reviewing.pieces_assigned}
                    className="w-full py-4 sm:py-5 px-6 bg-zinc-800 border border-zinc-700 rounded-xl text-2xl sm:text-3xl font-black text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder:text-zinc-600"
                  />
                  <p className="text-center text-zinc-500 text-[10px] sm:text-xs font-bold mt-3 uppercase tracking-widest">
                    {reviewing.pieces_assigned} asignadas - {unsold} devueltas = <span className="text-white">{reviewing.pieces_assigned - unsold} vendidas</span>
                  </p>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 sm:p-8 rounded-2xl text-white">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Total a Cobrar</p>
                  <p className="text-4xl sm:text-5xl font-black text-indigo-400">
                    ${((reviewing.pieces_assigned - unsold) * reviewing.lotteries?.piece_profit_cop).toLocaleString()}
                  </p>
                </div>

                <button 
                  onClick={confirmLiquidation}
                  className="w-full py-4 sm:py-5 bg-indigo-500 text-white rounded-xl font-black text-lg sm:text-xl tracking-wide hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  CONFIRMAR LIQUIDACIÓN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
