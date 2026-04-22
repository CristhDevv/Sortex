'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createAssignment, getDailyAssignments } from '@/app/actions/assignmentActions';
import { PlusCircle, ClipboardList, TrendingUp, DollarSign } from 'lucide-react';

export default function AssignmentsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [selectedVendor, setSelectedVendor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [ticketValue, setTicketValue] = useState(2000); // Default common value

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch active vendors
    const { data: activeVendors } = await supabase
      .from('vendors')
      .select('id, name, alias')
      .eq('is_active', true);
    
    if (activeVendors) setVendors(activeVendors);

    // Fetch assignments for the selected date
    const dailyData = await getDailyAssignments(date);
    setAssignments(dailyData);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createAssignment({
      vendor_id: selectedVendor,
      date,
      total_tickets: totalTickets,
      ticket_value_cop: ticketValue,
    });

    if (result.error) {
      alert(result.error);
    } else {
      setShowModal(false);
      fetchData();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Asignaciones Diarias</h1>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 block w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Nueva Asignación
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando asignaciones...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Boletas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartera Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reportes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((asg) => {
                  const middayReport = asg.reports?.find((r: any) => r.report_type === 'midday');
                  const nightReport = asg.reports?.find((r: any) => r.report_type === 'night');
                  
                  return (
                    <tr key={asg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{asg.vendors.name}</div>
                        <div className="text-sm text-gray-500">@{asg.vendors.alias}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asg.total_tickets} boletas
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">
                        {formatCurrency(asg.total_tickets * asg.ticket_value_cop)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${middayReport ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                            Mediodía: {middayReport ? '✓' : '✗'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${nightReport ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                            Noche: {nightReport ? '✓' : '✗'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                      No hay asignaciones para esta fecha
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <ClipboardList className="w-6 h-6 mr-2 text-indigo-600" />
              Nueva Asignación
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vendedor</label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Seleccionar vendedor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} (@{v.alias})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Boletas</label>
                  <input
                    type="number"
                    value={totalTickets}
                    onChange={(e) => setTotalTickets(parseInt(e.target.value))}
                    required
                    min="1"
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor Boleta ($)</label>
                  <input
                    type="number"
                    value={ticketValue}
                    onChange={(e) => setTicketValue(parseInt(e.target.value))}
                    required
                    min="100"
                    step="100"
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-xl mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-indigo-700 font-medium">Cartera Total:</span>
                  <span className="text-xl font-bold text-indigo-900">{formatCurrency(totalTickets * ticketValue)}</span>
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
