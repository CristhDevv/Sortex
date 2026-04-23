'use client';

import { useEffect, useState } from 'react';
import { 
  createAssignment, 
  getAssignmentsByDate, 
  deleteAssignment 
} from '@/app/actions/assignmentActions';
import { getLotteries } from '@/app/actions/lotteryActions';
import { getVendors } from '@/app/actions/vendorAuthActions';
import { 
  Plus, 
  Trash2, 
  ClipboardList, 
  CheckCircle2, 
  Circle, 
  XCircle,
  Calendar,
  User,
  Ticket,
  Clock
} from 'lucide-react';
import { format, toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Bogota';

export default function AssignmentsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedLottery, setSelectedLottery] = useState('');
  const [date, setDate] = useState(() => {
    const zonedNow = toZonedTime(new Date(), TIMEZONE);
    return format(zonedNow, 'yyyy-MM-dd');
  });
  const [piecesAssigned, setPiecesAssigned] = useState(1);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [date]);

  async function fetchInitialData() {
    const [vendorsRes, lotteriesRes] = await Promise.all([
      getVendors(),
      getLotteries()
    ]);
    
    if (vendorsRes.data) setVendors(vendorsRes.data);
    if (lotteriesRes.data) {
      setLotteries(lotteriesRes.data.filter((l: any) => l.is_active));
    }
  }

  async function fetchAssignments() {
    setLoading(true);
    const dailyData = await getAssignmentsByDate(date);
    setAssignments(dailyData);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    const result = await createAssignment({
      vendor_id: selectedVendor,
      lottery_id: selectedLottery,
      date,
      pieces_assigned: piecesAssigned,
    });

    if (result.error) {
      alert(result.error);
    } else {
      setShowModal(false);
      fetchAssignments();
      // Reset some form fields
      setPiecesAssigned(1);
    }
    setFormLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta asignación?')) return;
    
    const result = await deleteAssignment(id);
    if (result.success) {
      fetchAssignments();
    } else {
      alert('Error: ' + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-8 border-b border-gray-100 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Asignaciones</h1>
          <div className="mt-2 flex items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
            <Calendar className="text-gray-400 mr-2" size={18} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent font-bold text-gray-700 border-none focus:ring-0 p-0 text-sm"
            />
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Assignments List */}
      <div className="px-6 space-y-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-bold">Buscando asignaciones...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <ClipboardList className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 font-bold">No hay asignaciones para este día</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignments.map((asg) => {
              const middayReport = asg.reports?.find((r: any) => r.report_type === 'midday');
              const nightReport = asg.reports?.find((r: any) => r.report_type === 'night');
              
              return (
                <div key={asg.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover:border-indigo-100 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mr-4">
                        <User className="text-indigo-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 leading-none mb-1">{asg.vendors?.name}</h3>
                        <p className="text-gray-400 font-medium text-sm">@{asg.vendors?.alias}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(asg.id)}
                      className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center">
                        <Ticket className="text-indigo-600 mr-3" size={20} />
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lotería</p>
                          <p className="font-bold text-gray-900">{asg.lotteries?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jornada</p>
                        <span className={`text-xs font-black uppercase tracking-wider ${asg.lotteries?.draw_time === 'midday' ? 'text-amber-600' : 'text-slate-800'}`}>
                          {asg.lotteries?.draw_time === 'midday' ? 'Mediodía' : 'Noche'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fracciones</p>
                        <p className="text-2xl font-black text-indigo-600">{asg.pieces_assigned}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reportes</p>
                        <div className="flex gap-2 mt-1">
                          <div title="Mediodía">
                            {middayReport ? <CheckCircle2 className="text-green-500" size={24} /> : <Circle className="text-gray-200" size={24} />}
                          </div>
                          <div title="Noche">
                            {nightReport ? <CheckCircle2 className="text-green-500" size={24} /> : <Circle className="text-gray-200" size={24} />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900">Nueva Asignación</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={32} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Vendedor</label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all appearance-none"
                >
                  <option value="">Seleccionar...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} (@{v.alias})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Lotería</label>
                <select
                  value={selectedLottery}
                  onChange={(e) => setSelectedLottery(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all appearance-none"
                >
                  <option value="">Seleccionar...</option>
                  {lotteries.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.draw_time === 'midday' ? 'Día' : 'Noche'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Fracciones</label>
                  <input
                    type="number"
                    value={piecesAssigned}
                    onChange={(e) => setPiecesAssigned(parseInt(e.target.value))}
                    required
                    min="1"
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={formLoading}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50"
              >
                {formLoading ? 'Guardando...' : 'ASIGNAR AHORA'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
