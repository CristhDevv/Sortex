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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-6 py-8 border-b border-gray-100 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Liquidaciones</h1>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-2 block px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700"
          />
        </div>
        
        <div className="flex space-x-3">
          <button onClick={exportPDF} className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-100 hover:bg-rose-700 text-sm font-bold active:scale-95 transition-all">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </button>
          <button onClick={exportExcel} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 text-sm font-bold active:scale-95 transition-all">
            <TableIcon className="w-4 h-4 mr-2" /> EXCEL
          </button>
        </div>
      </div>

      <div className="px-6 space-y-6">
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 mb-8">
          <p className="text-sm font-bold text-indigo-200 uppercase tracking-widest mb-2">Utilidad Total del Día</p>
          <p className="text-5xl font-black">${calculateTotal().toLocaleString()}</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-bold">Procesando datos...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <Calculator className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 font-bold">No hay asignaciones para liquidar en esta fecha</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.map((item) => {
              const liq = item.liquidations?.[0];
              const middayReport = item.reports?.find((r: any) => r.report_type === 'midday');
              const nightReport = item.reports?.find((r: any) => r.report_type === 'night');
              const isMidday = item.lotteries?.draw_time === 'midday';

              return (
                <div key={item.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover:border-indigo-100 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mr-4">
                          <User className="text-indigo-600" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900 leading-none mb-1">{item.vendors?.name}</h3>
                          <p className="text-gray-400 font-medium text-sm">@{item.vendors?.alias}</p>
                        </div>
                      </div>
                      {liq ? (
                        <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-green-200">
                          Liquidado
                        </div>
                      ) : (
                        <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-amber-200">
                          Pendiente
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center">
                          <Ticket className="text-indigo-600 mr-3" size={20} />
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lotería</p>
                            <p className="font-bold text-gray-900">{item.lotteries?.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jornada</p>
                          <span className={`text-xs font-black uppercase tracking-wider ${isMidday ? 'text-amber-600' : 'text-slate-800'}`}>
                            {isMidday ? 'Mediodía' : 'Noche'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fracciones</p>
                          <p className="text-2xl font-black text-indigo-600">{item.pieces_assigned}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reportes</p>
                          <div className="flex gap-2 mt-1">
                            <div title="Mediodía">
                              {middayReport ? (
                                <CheckCircle2 className={middayReport.is_on_time ? "text-green-500" : "text-amber-500"} size={24} />
                              ) : (
                                <Circle className="text-gray-200" size={24} />
                              )}
                            </div>
                            <div title="Noche">
                              {nightReport ? (
                                <CheckCircle2 className={nightReport.is_on_time ? "text-green-500" : "text-amber-500"} size={24} />
                              ) : (
                                <Circle className="text-gray-200" size={24} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-6 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilidad Calculada</p>
                      {liq ? (
                        <p className="text-2xl font-black text-gray-900">${liq.profit_cop.toLocaleString()}</p>
                      ) : (
                        <p className="text-xl font-bold text-gray-300">---</p>
                      )}
                    </div>
                    <button 
                      onClick={() => handleReview(item)}
                      className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 active:scale-95 transition-all flex items-center shadow-lg shadow-gray-200"
                    >
                      <Calculator size={18} className="mr-2" />
                      {liq ? 'REVISAR' : 'LIQUIDAR'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Revisión: {reviewing.vendors?.name}</h2>
                <p className="text-gray-500 font-medium">{reviewing.lotteries?.name} - {reviewing.lotteries?.draw_time === 'midday' ? 'Día' : 'Noche'}</p>
              </div>
              <button onClick={() => setReviewing(null)} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm">
                <XCircle className="w-8 h-8" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Evidencia Fotográfica</p>
                {photoUrl ? (
                  <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm bg-gray-100">
                    <img src={photoUrl} alt="Reporte" className="w-full h-auto" />
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-300">
                    <Eye className="w-16 h-16 mb-4" />
                    <p className="text-base font-bold">Sin foto disponible</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-8 flex flex-col justify-center">
                <div className="bg-gray-50 p-6 rounded-3xl space-y-4 border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Fracciones Asignadas:</span>
                    <span className="font-black text-xl text-gray-900">{reviewing.pieces_assigned}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Utilidad x Fracción:</span>
                    <span className="font-black text-xl text-indigo-600">${reviewing.lotteries?.piece_profit_cop.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">
                    Fracciones No Vendidas (Devueltas)
                  </label>
                  <input
                    type="number"
                    value={unsold}
                    onChange={(e) => setUnsold(Math.max(0, parseInt(e.target.value) || 0))}
                    max={reviewing.pieces_assigned}
                    className="w-full py-5 px-6 bg-gray-50 border-none rounded-2xl text-3xl font-black text-center focus:ring-4 focus:ring-indigo-100 transition-all text-gray-900"
                  />
                  <p className="text-center text-gray-400 text-sm font-bold mt-3">
                    Calculando: {reviewing.pieces_assigned} asignadas - {unsold} devueltas = <span className="text-gray-900">{reviewing.pieces_assigned - unsold} vendidas</span>
                  </p>
                </div>

                <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200">
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Utilidad Total a Cobrar</p>
                  <p className="text-5xl font-black">
                    ${((reviewing.pieces_assigned - unsold) * reviewing.lotteries?.piece_profit_cop).toLocaleString()}
                  </p>
                </div>

                <button 
                  onClick={confirmLiquidation}
                  className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 active:scale-95"
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
