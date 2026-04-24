'use client';

import { useState, useEffect } from 'react';
import { 
  getLotteries, 
  createLottery, 
  updateLottery, 
  toggleLotteryActive 
} from '@/app/actions/lotteryActions';
import { Plus, Power, Edit3, XCircle, Ticket, Coins, Percent, Clock, Calendar, CheckCircle2, XOctagon } from 'lucide-react';

export default function OwnerLotteriesPage() {
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLottery, setEditingLottery] = useState<any>(null);

  // Form states
  const [name, setName] = useState('');
  const [prizeCop, setPrizeCop] = useState('');
  const [piecesPerTicket, setPiecesPerTicket] = useState('');
  const [piecePriceCop, setPiecePriceCop] = useState('');
  const [pieceProfitCop, setPieceProfitCop] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [drawTime, setDrawTime] = useState('midday');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const result = await getLotteries();
    if (result.data) setLotteries(result.data);
    setLoading(false);
  }

  function resetForm() {
    setName('');
    setPrizeCop('');
    setPiecesPerTicket('');
    setPiecePriceCop('');
    setPieceProfitCop('');
    setFrequency('daily');
    setDrawTime('midday');
    setEditingLottery(null);
  }

  function handleEdit(lottery: any) {
    setEditingLottery(lottery);
    setName(lottery.name);
    setPrizeCop(lottery.prize_cop.toString());
    setPiecesPerTicket(lottery.pieces_per_ticket.toString());
    setPiecePriceCop(lottery.piece_price_cop.toString());
    setPieceProfitCop(lottery.piece_profit_cop.toString());
    setFrequency(lottery.frequency);
    setDrawTime(lottery.draw_time);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);

    const data = {
      name,
      prize_cop: parseInt(prizeCop),
      pieces_per_ticket: parseInt(piecesPerTicket),
      piece_price_cop: parseInt(piecePriceCop),
      piece_profit_cop: parseInt(pieceProfitCop),
      frequency,
      draw_time: drawTime
    };

    let result;
    if (editingLottery) {
      result = await updateLottery(editingLottery.id, data);
    } else {
      result = await createLottery(data);
    }

    if (result.success) {
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } else {
      alert('Error: ' + result.error);
    }
    setFormLoading(false);
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    const result = await toggleLotteryActive(id, currentStatus);
    if (result.success) {
      fetchData();
    } else {
      alert('Error: ' + result.error);
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6" style={{ background: 'var(--bg-page)' }}>
      {/* Header */}
      <div 
        className="flex justify-between items-center p-4 sm:p-6 rounded-2xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Loterías</h1>
          <p className="font-medium text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Configuración de sorteos y premios</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-500 text-white p-3 sm:p-4 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Lotteries List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20 animate-pulse text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Obteniendo configuraciones...
          </div>
        ) : lotteries.length === 0 ? (
          <div 
            className="text-center py-20 rounded-3xl border border-dashed"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <Ticket className="mx-auto mb-4" size={48} style={{ color: 'var(--border)' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>No hay loterías configuradas</p>
          </div>
        ) : (
          <div 
            className="rounded-2xl overflow-hidden shadow-2xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="divide-y divide-[var(--border)]">
              {lotteries.map((lottery) => (
                <div 
                  key={lottery.id} 
                  className={`p-4 sm:p-6 transition-colors ${!lottery.is_active ? 'opacity-50 grayscale' : ''}`}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    
                    {/* Left: Info */}
                    <div className="flex items-center gap-4">
                      <div 
                        className={`p-3 rounded-xl border flex-shrink-0 transition-colors ${lottery.is_active ? 'bg-indigo-500/10 border-indigo-500/20' : ''}`}
                        style={lottery.is_active ? {} : { background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)' }}
                      >
                        <Ticket className={lottery.is_active ? 'text-indigo-400' : ''} style={lottery.is_active ? {} : { color: 'var(--text-muted)' }} size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-black leading-tight mb-2" style={{ color: 'var(--text-primary)' }}>{lottery.name}</h3>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${lottery.frequency === 'daily' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                            {lottery.frequency === 'daily' ? 'Diaria' : 'Mensual'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${lottery.draw_time === 'midday' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                            {lottery.draw_time === 'midday' ? 'Mediodía' : 'Noche'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 flex-1 lg:mx-8">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Premio Mayor</p>
                        <p className="text-sm sm:text-base font-black" style={{ color: 'var(--text-primary)' }}>${lottery.prize_cop.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Fracciones</p>
                        <p className="text-sm sm:text-base font-black" style={{ color: 'var(--text-primary)' }}>{lottery.pieces_per_ticket}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Precio Frac.</p>
                        <p className="text-sm sm:text-base font-black" style={{ color: 'var(--text-secondary)' }}>${lottery.piece_price_cop.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Ganancia Frac.</p>
                        <p className="text-sm sm:text-base font-black text-indigo-400">${lottery.piece_profit_cop.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => handleEdit(lottery)}
                        className="p-3 rounded-xl border transition-all"
                        style={{ background: 'var(--bg-card-hover)', color: 'var(--text-secondary)', borderColor: 'var(--border-hover)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--border)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                      >
                        <Edit3 size={20} />
                      </button>
                      <button 
                        onClick={() => handleToggleActive(lottery.id, lottery.is_active)}
                        className={`p-3 rounded-xl border transition-all ${lottery.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'}`}
                      >
                        <Power size={20} />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-xl rounded-3xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] shadow-2xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex justify-between items-center mb-8 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {editingLottery ? 'Editar Lotería' : 'Nueva Lotería'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <XCircle size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block" style={{ color: 'var(--text-muted)' }}>Nombre de la Lotería</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Lotería de Medellín"
                  required
                  className="w-full px-5 py-4 border rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block" style={{ color: 'var(--text-muted)' }}>Premio COP</label>
                  <input
                    type="number"
                    value={prizeCop}
                    onChange={(e) => setPrizeCop(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-5 py-4 border rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block" style={{ color: 'var(--text-muted)' }}>Fracciones x Billete</label>
                  <input
                    type="number"
                    value={piecesPerTicket}
                    onChange={(e) => setPiecesPerTicket(e.target.value)}
                    placeholder="Ej: 3"
                    required
                    className="w-full px-5 py-4 border rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block" style={{ color: 'var(--text-muted)' }}>Precio Fracción</label>
                  <input
                    type="number"
                    value={piecePriceCop}
                    onChange={(e) => setPiecePriceCop(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-5 py-4 border rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block" style={{ color: 'var(--text-muted)' }}>Ganancia Fracción</label>
                  <input
                    type="number"
                    value={pieceProfitCop}
                    onChange={(e) => setPieceProfitCop(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-5 py-4 border rounded-xl font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block" style={{ color: 'var(--text-muted)' }}>Frecuencia</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-5 py-4 border rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                    style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                  >
                    <option value="daily">Diaria</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block" style={{ color: 'var(--text-muted)' }}>Jornada</label>
                  <select
                    value={drawTime}
                    onChange={(e) => setDrawTime(e.target.value)}
                    className="w-full px-5 py-4 border rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                    style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                  >
                    <option value="midday">Mediodía</option>
                    <option value="night">Noche</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={formLoading}
                className="w-full mt-6 py-4 sm:py-5 bg-indigo-500 text-white rounded-xl font-black text-lg sm:text-xl hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 tracking-wide"
              >
                {formLoading ? 'GUARDANDO...' : editingLottery ? 'ACTUALIZAR LOTERÍA' : 'CREAR LOTERÍA'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
