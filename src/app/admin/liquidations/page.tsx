'use client';

import { useEffect, useState } from 'react';
import { getDailyLiquidations, processLiquidation } from '@/app/actions/liquidationActions';
import { getSignedPhotoUrl } from '@/app/actions/reportActions';
import { FileText, Table as TableIcon, CheckCircle2, AlertTriangle, XCircle, Eye, Calculator } from 'lucide-react';
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
    const liquidations = await getDailyLiquidations(selectedDate);
    setData(liquidations);
    setLoading(false);
  };

  const handleReview = async (item: any) => {
    setReviewing(item);
    setUnsold(item.liquidations?.[0]?.unsold_tickets || 0);
    
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
      total_tickets: reviewing.total_tickets,
      unsold_tickets: unsold,
      ticket_value: reviewing.ticket_value_cop,
    });

    if (result.success) {
      setReviewing(null);
      fetchData();
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    doc.text(`Resumen de Liquidación - ${selectedDate}`, 14, 15);
    
    const tableData = data.map(item => {
      const liq = item.liquidations?.[0];
      return [
        item.vendors.name,
        item.total_tickets,
        liq?.unsold_tickets || 'Pend.',
        liq?.sold_tickets || 'Pend.',
        liq ? `$${liq.amount_due_cop.toLocaleString()}` : 'Pend. Revisión'
      ];
    });

    doc.autoTable({
      head: [['Vendedor', 'Asignadas', 'Devueltas', 'Vendidas', 'Cobro']],
      body: tableData,
      startY: 20,
    });

    doc.save(`Liquidacion_${selectedDate}.pdf`);
  };

  const exportExcel = () => {
    const tableData = data.map(item => {
      const liq = item.liquidations?.[0];
      return {
        'Vendedor': item.vendors.name,
        'Asignadas': item.total_tickets,
        'Devueltas': liq?.unsold_tickets ?? 'Pendiente',
        'Vendidas': liq?.sold_tickets ?? 'Pendiente',
        'Cobro (COP)': liq?.amount_due_cop ?? 0
      };
    });

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Liquidaciones');
    XLSX.writeFile(wb, `Liquidacion_${selectedDate}.xlsx`);
  };

  const getStatusIcon = (item: any) => {
    const midday = item.reports?.find((r: any) => r.report_type === 'midday');
    const night = item.reports?.find((r: any) => r.report_type === 'night');

    const Status = ({ onTime, exists }: any) => {
      if (!exists) return <XCircle className="w-4 h-4 text-gray-300" />;
      return onTime 
        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
        : <AlertTriangle className="w-4 h-4 text-amber-500" />;
    };

    return (
      <div className="flex space-x-2">
        <Status onTime={midday?.is_on_time} exists={!!midday} />
        <Status onTime={night?.is_on_time} exists={!!night} />
      </div>
    );
  };

  const calculateTotal = () => {
    return data.reduce((sum, item) => sum + (item.liquidations?.[0]?.amount_due_cop || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Liquidaciones Diarias</h1>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-2 block w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
        
        <div className="flex space-x-3">
          <button onClick={exportPDF} className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-bold">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </button>
          <button onClick={exportExcel} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-bold">
            <TableIcon className="w-4 h-4 mr-2" /> EXCEL
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Procesando datos...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Vendedor</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Estado Reportes</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Asignadas</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Cobro</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item) => {
                const liq = item.liquidations?.[0];
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{item.vendors.name}</div>
                      <div className="text-xs text-gray-500">@{item.vendors.alias}</div>
                    </td>
                    <td className="px-6 py-4">{getStatusIcon(item)}</td>
                    <td className="px-6 py-4 text-sm font-medium">{item.total_tickets}</td>
                    <td className="px-6 py-4">
                      {liq ? (
                        <span className="text-sm font-black text-indigo-600">
                          ${liq.amount_due_cop.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                          PENDIENTE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleReview(item)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Calculator className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-black">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right text-gray-500">TOTAL DEL DÍA:</td>
                <td colSpan={2} className="px-6 py-4 text-2xl text-indigo-700">
                  ${calculateTotal().toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900">Revisión: {reviewing.vendors.name}</h2>
              <button onClick={() => setReviewing(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Evidencia Fotográfica</p>
                {photoUrl ? (
                  <img src={photoUrl} alt="Reporte" className="w-full rounded-2xl shadow-sm border border-gray-100" />
                ) : (
                  <div className="aspect-[3/4] bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-300">
                    <Eye className="w-12 h-12 mb-2" />
                    <p className="text-sm font-bold">Sin foto disponible</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500 font-medium">Asignadas:</span>
                    <span className="font-bold">{reviewing.total_tickets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Valor c/u:</span>
                    <span className="font-bold">${reviewing.ticket_value_cop.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-400 uppercase mb-2 tracking-widest">Boletas No Vendidas (Devueltas)</label>
                  <input
                    type="number"
                    value={unsold}
                    onChange={(e) => setUnsold(Math.max(0, parseInt(e.target.value) || 0))}
                    max={reviewing.total_tickets}
                    className="w-full py-4 px-6 bg-gray-50 border-none rounded-2xl text-2xl font-black focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div className="bg-indigo-600 p-6 rounded-2xl text-white">
                  <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-1">Monto a Cobrar</p>
                  <p className="text-4xl font-black">
                    ${((reviewing.total_tickets - unsold) * reviewing.ticket_value_cop).toLocaleString()}
                  </p>
                </div>

                <button 
                  onClick={confirmLiquidation}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
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
