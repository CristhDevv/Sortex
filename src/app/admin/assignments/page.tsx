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
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Asignaciones</h1>
          <div className="mt-2 flex items-center bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800 w-fit">
            <Calendar className="text-zinc-500 mr-2" size={16} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent font-bold text-zinc-300 border-none focus:ring-0 p-0 text-sm outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center p-3 sm:px-4 sm:py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <Plus size={20} className="sm:mr-2" />
          <span className="hidden sm:inline font-bold text-sm">Nueva Asignación</span>
        </button>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500 animate-pulse text-sm font-bold tracking-widest uppercase">
          Buscando asignaciones...
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 rounded-3xl border border-zinc-800 border-dashed">
          <ClipboardList className="mx-auto text-zinc-700 mb-4" size={48} />
          <p className="text-zinc-500 font-bold text-sm">No hay asignaciones para este día</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="divide-y divide-zinc-800">
            {assignments.map((asg) => {
              const middayReport = asg.reports?.find((r: any) => r.report_type === 'midday');
              const nightReport = asg.reports?.find((r: any) => r.report_type === 'night');
              
              return (
                <div key={asg.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-800/50 transition-colors group gap-4">
                  {/* Info block */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                      <User className="text-indigo-400" size={20} />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-black text-white leading-tight">{asg.vendors?.name}</div>
                      <div className="text-xs font-bold text-zinc-500">@{asg.vendors?.alias}</div>
                    </div>
                  </div>

                  {/* Details block */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto">
                    {/* Lottery */}
                    <div className="hidden sm:block">
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Lotería</div>
                      <div className="text-sm font-bold text-zinc-300 flex items-center gap-1.5">
                        <Ticket size={14} className="text-zinc-500" />
                        {asg.lotteries?.name}
                      </div>
                    </div>

                    {/* Turno */}
                    <span className={`px-2.5 py-1 inline-flex text-[10px] uppercase tracking-widest font-black rounded-lg ${
                      asg.lotteries?.draw_time === 'midday' 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {asg.lotteries?.draw_time === 'midday' ? 'Día' : 'Noche'}
                    </span>

                    {/* Pieces */}
                    <div className="text-center min-w-[3rem]">
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Frac.</div>
                      <div className="text-base font-black text-white">{asg.pieces_assigned}</div>
                    </div>

                    {/* Reports */}
                    <div className="flex gap-1.5 items-center bg-zinc-950/50 p-1.5 rounded-xl border border-zinc-800">
                      <div title="Mediodía" className={`w-6 h-6 rounded-lg flex items-center justify-center ${middayReport ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-600'}`}>
                        {middayReport ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      </div>
                      <div title="Noche" className={`w-6 h-6 rounded-lg flex items-center justify-center ${nightReport ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-600'}`}>
                        {nightReport ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      </div>
                    </div>

                    {/* Actions */}
                    <button 
                      onClick={() => handleDelete(asg.id)}
                      className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20 flex-shrink-0"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white tracking-tight">Nueva Asignación</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Vendedor</label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700 text-white font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                >
                  <option value="" className="text-zinc-500">Seleccionar...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} (@{v.alias})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Lotería</label>
                <select
                  value={selectedLottery}
                  onChange={(e) => setSelectedLottery(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700 text-white font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                >
                  <option value="" className="text-zinc-500">Seleccionar...</option>
                  {lotteries.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.draw_time === 'midday' ? 'Día' : 'Noche'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700 text-white font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Fracciones</label>
                  <input
                    type="number"
                    value={piecesAssigned}
                    onChange={(e) => setPiecesAssigned(parseInt(e.target.value))}
                    required
                    min="1"
                    className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700 text-white font-black rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-center"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={formLoading}
                className="w-full mt-8 py-4 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
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
