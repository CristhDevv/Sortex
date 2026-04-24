'use client';

import { useEffect, useState } from 'react';
import { 
  createAssignment, 
  getAssignmentsByDate, 
  deleteAssignment,
  updateAssignment,
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
  Clock,
  Pencil,
  Check,
  X,
  Loader2,
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

  // Inline edit states
  const [editingId, setEditingId]             = useState<string | null>(null);
  const [editingPieces, setEditingPieces]     = useState<number>(0);
  const [editingLoading, setEditingLoading]   = useState(false);
  const [editingError, setEditingError]       = useState<string | null>(null);

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

  const handleEditStart = (asg: any) => {
    setEditingId(asg.id);
    setEditingPieces(asg.pieces_assigned);
    setEditingError(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingError(null);
  };

  const handleEditConfirm = async () => {
    if (!editingId) return;
    setEditingLoading(true);
    setEditingError(null);

    const result = await updateAssignment(editingId, editingPieces);
    if (result.error) {
      setEditingError(result.error);
    } else {
      setEditingId(null);
      fetchAssignments();
    }
    setEditingLoading(false);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6" style={{ background: 'var(--bg-page)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Asignaciones</h1>
          <div 
            className="mt-2 flex items-center px-3 py-2 rounded-xl border w-fit"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <Calendar size={16} style={{ color: 'var(--text-muted)' }} className="mr-2" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent font-bold border-none focus:ring-0 p-0 text-sm outline-none"
              style={{ color: 'var(--text-secondary)' }}
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
        <div className="text-center py-12 animate-pulse text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Buscando asignaciones...
        </div>
      ) : assignments.length === 0 ? (
        <div 
          className="text-center py-16 rounded-3xl border border-dashed"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <ClipboardList className="mx-auto mb-4" size={48} style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>No hay asignaciones para este día</p>
        </div>
      ) : (
        <div 
          className="rounded-2xl overflow-hidden shadow-2xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="divide-y divide-[var(--border)]">
            {assignments.map((asg) => {
              const middayReport  = asg.reports?.find((r: any) => r.report_type === 'midday');
              const nightReport   = asg.reports?.find((r: any) => r.report_type === 'night');
              const isLiquidated  = Array.isArray(asg.liquidations) && asg.liquidations.some((l: any) => l.profit_cop !== null);
              const isEditing     = editingId === asg.id;

              return (
                <div 
                  key={asg.id} 
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between transition-colors group gap-4"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Info block */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                      <User className="text-indigo-400" size={20} />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{asg.vendors?.name}</div>
                      <div className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>@{asg.vendors?.alias}</div>
                    </div>
                  </div>

                  {/* Details block */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto">
                    {/* Lottery */}
                    <div className="hidden sm:block">
                      <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Lotería</div>
                      <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <Ticket size={14} style={{ color: 'var(--text-muted)' }} />
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

                    {/* Pieces — editable inline */}
                    <div className="text-center min-w-[5rem]">
                      <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Frac.</div>
                      {isEditing ? (
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            value={editingPieces}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setEditingPieces(isNaN(val) ? 1 : Math.max(1, val));
                            }}
                            min={1}
                            autoFocus
                            className="w-16 text-center font-black border rounded-lg py-1 px-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                          />
                          {editingError && (
                            <p className="text-rose-400 text-[10px] font-bold leading-tight max-w-[110px] text-center">{editingError}</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{asg.pieces_assigned}</div>
                      )}
                    </div>

                    {/* Reports status */}
                    <div 
                      className="flex gap-1.5 items-center p-1.5 rounded-xl border"
                      style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}
                    >
                      <div title="Mediodía" className={`w-6 h-6 rounded-lg flex items-center justify-center border ${middayReport ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'border-transparent'}`} style={{ background: middayReport ? undefined : 'var(--bg-card-hover)', color: middayReport ? undefined : 'var(--text-muted)' }}>
                        {middayReport ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      </div>
                      <div title="Noche" className={`w-6 h-6 rounded-lg flex items-center justify-center border ${nightReport ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'border-transparent'}`} style={{ background: nightReport ? undefined : 'var(--bg-card-hover)', color: nightReport ? undefined : 'var(--text-muted)' }}>
                        {nightReport ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      </div>
                    </div>

                    {/* Actions */}
                    {isEditing ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={handleEditConfirm}
                          disabled={editingLoading}
                          title="Confirmar"
                          className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all disabled:opacity-50"
                        >
                          {editingLoading
                            ? <Loader2 size={18} className="animate-spin" />
                            : <Check size={18} />}
                        </button>
                        <button
                          onClick={handleEditCancel}
                          disabled={editingLoading}
                          title="Cancelar"
                          className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all disabled:opacity-50"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditStart(asg)}
                          disabled={isLiquidated}
                          title={isLiquidated ? 'Ya liquidada' : 'Editar fracciones'}
                          className={`p-2.5 rounded-xl border border-transparent transition-all ${
                            isLiquidated
                              ? 'opacity-30 cursor-not-allowed text-indigo-400'
                              : 'text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/20'
                          }`}
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(asg.id)}
                          className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20 flex-shrink-0"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal — Nueva Asignación */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border animate-in fade-in zoom-in-95 duration-200"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Nueva Asignación</h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="transition-colors p-1"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block" style={{ color: 'var(--text-muted)' }}>Vendedor</label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                  style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                >
                  <option value="" style={{ color: 'var(--text-muted)' }}>Seleccionar...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} (@{v.alias})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block" style={{ color: 'var(--text-muted)' }}>Lotería</label>
                <select
                  value={selectedLottery}
                  onChange={(e) => setSelectedLottery(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                  style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                >
                  <option value="" style={{ color: 'var(--text-muted)' }}>Seleccionar...</option>
                  {lotteries.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.draw_time === 'midday' ? 'Día' : 'Noche'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block" style={{ color: 'var(--text-muted)' }}>Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 border font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block" style={{ color: 'var(--text-muted)' }}>Fracciones</label>
                  <input
                    type="number"
                    value={piecesAssigned}
                    onChange={(e) => setPiecesAssigned(parseInt(e.target.value))}
                    required
                    min="1"
                    className="w-full px-4 py-3.5 border font-black rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-center"
                    style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
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
