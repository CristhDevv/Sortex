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
    <div className="min-h-screen p-4 sm:p-6 space-y-6" style={{ background: 'var(--bg-page)' }}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Liquidaciones</h1>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-2 block px-4 py-2 border rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-fit"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
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
          <div className="text-center py-12 animate-pulse text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Procesando datos...
          </div>
        ) : data.length === 0 ? (
          <div 
            className="text-center py-16 rounded-3xl border border-dashed"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <Calculator className="mx-auto mb-4" size={48} style={{ color: 'var(--border)' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>No hay asignaciones para liquidar en esta fecha</p>
          </div>
        ) : (
          <div 
            className="rounded-2xl overflow-hidden shadow-2xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="divide-y divide-[var(--border)]">
              {data.map((item) => {
                const liq = item.liquidations?.[0];
                const isMidday = item.lotteries?.draw_time === 'midday';

                return (
                  <div 
                    key={item.id} 
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between transition-colors group gap-4"
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Info Block */}
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
                        style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)' }}
                      >
                        <User style={{ color: 'var(--text-muted)' }} size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{item.vendors?.name}</h3>
                          <span className={`px-2 py-0.5 inline-flex text-[9px] uppercase tracking-widest font-black rounded-lg ${
                            liq 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {liq ? 'Liquidado' : 'Pendiente'}
                          </span>
                        </div>
                        <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>@{item.vendors?.alias}</p>
                      </div>
                    </div>

                    {/* Details Block */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 w-full sm:w-auto">
                      {/* Lottery */}
                      <div className="hidden sm:block">
                        <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Lotería</div>
                        <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                          <Ticket size={14} style={{ color: 'var(--text-muted)' }} />
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
                        <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Utilidad</div>
                        {liq ? (
                          <div className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>${liq.profit_cop.toLocaleString()}</div>
                        ) : (
                          <div className="text-sm font-bold" style={{ color: 'var(--text-decorative)' }}>---</div>
                        )}
                      </div>

                      {/* Action */}
                      <button 
                        onClick={() => handleReview(item)}
                        className={`flex items-center justify-center p-2.5 sm:px-4 sm:py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          liq
                            ? 'font-bold border transition-all'
                            : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'
                        }
                        style={liq ? { background: 'var(--bg-card-hover)', color: 'var(--text-secondary)', borderColor: 'var(--border-hover)' } : {}}
                        onMouseEnter={(e) => { if(liq) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--border-hover)' } }}
                        onMouseLeave={(e) => { if(liq) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-card-hover)' } }}
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
          <div 
            className="rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border animate-in fade-in zoom-in-95 duration-200"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="p-6 sm:p-8 border-b flex justify-between items-center" style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Liquidación: {reviewing.vendors?.name}</h2>
                <p className="font-bold text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{reviewing.lotteries?.name} - {reviewing.lotteries?.draw_time === 'midday' ? 'Mediodía' : 'Noche'}</p>
              </div>
              <button onClick={() => setReviewing(null)} className="transition-colors p-1" style={{ color: 'var(--text-muted)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                <XCircle size={28} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              <div>
                <p className="text-[10px] font-black uppercase mb-4 tracking-widest" style={{ color: 'var(--text-muted)' }}>Evidencia Fotográfica</p>
                {photoUrl ? (
                  <div 
                    className="rounded-2xl overflow-hidden border flex items-center justify-center h-64 sm:h-auto"
                    style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}
                  >
                    <img src={photoUrl} alt="Reporte" className="w-full h-full object-contain sm:h-auto" />
                  </div>
                ) : (
                  <div 
                    className="aspect-[3/4] sm:aspect-auto sm:h-64 border border-dashed rounded-2xl flex flex-col items-center justify-center"
                    style={{ background: 'var(--bg-page)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                  >
                    <Eye className="w-12 h-12 sm:w-16 sm:h-16 mb-4" style={{ color: 'var(--border)' }} />
                    <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-decorative)' }}>Sin foto disponible</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-6 sm:space-y-8 flex flex-col justify-center">
                <div 
                  className="p-6 rounded-2xl space-y-4 border"
                  style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>Fracciones Asignadas</span>
                    <span className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>{reviewing.pieces_assigned}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>Utilidad x Fracción</span>
                    <span className="font-black text-xl text-indigo-400">${reviewing.lotteries?.piece_profit_cop.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase mb-3 tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>
                    Devueltas (No vendidas)
                  </label>
                  <input
                    type="number"
                    value={unsold}
                    onChange={(e) => setUnsold(Math.max(0, parseInt(e.target.value) || 0))}
                    max={reviewing.pieces_assigned}
                    className="w-full py-4 sm:py-5 px-6 border rounded-xl text-2xl sm:text-3xl font-black text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                  />
                  <p className="text-center text-[10px] sm:text-xs font-bold mt-3 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    {reviewing.pieces_assigned} asignadas - {unsold} devueltas = <span style={{ color: 'var(--text-primary)' }}>{reviewing.pieces_assigned - unsold} vendidas</span>
                  </p>
                </div>

                <div 
                  className="border p-6 sm:p-8 rounded-2xl"
                  style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                >
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
