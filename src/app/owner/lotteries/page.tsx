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
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Loterías</h1>
          <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1">Configuración de sorteos y premios</p>
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
          <div className="text-center py-20 text-zinc-500 animate-pulse text-sm font-bold tracking-widest uppercase">
            Cargando loterías...
          </div>
        ) : lotteries.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900 rounded-3xl border border-zinc-800 border-dashed">
            <Ticket className="mx-auto text-zinc-700 mb-4" size={48} />
            <p className="text-zinc-500 font-bold text-sm">No hay loterías configuradas</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="divide-y divide-zinc-800">
              {lotteries.map(lottery => (
                <div key={lottery.id} className={`p-4 sm:p-6 hover:bg-zinc-800/50 transition-colors ${!lottery.is_active ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    
                    {/* Left: Info */}
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl border flex-shrink-0 ${lottery.is_active ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-zinc-800 border-zinc-700'}`}>
                        <Ticket className={lottery.is_active ? 'text-indigo-400' : 'text-zinc-500'} size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-white leading-tight mb-2">{lottery.name}</h3>
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
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Premio Mayor</p>
                        <p className="text-sm sm:text-base font-black text-white">${lottery.prize_cop.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Fracciones</p>
                        <p className="text-sm sm:text-base font-black text-white">{lottery.pieces_per_ticket}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Precio Frac.</p>
                        <p className="text-sm sm:text-base font-black text-zinc-300">${lottery.piece_price_cop.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Ganancia Frac.</p>
                        <p className="text-sm sm:text-base font-black text-indigo-400">${lottery.piece_profit_cop.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => handleEdit(lottery)}
                        className="p-3 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-white transition-all"
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
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-3xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {editingLottery ? 'Editar Lotería' : 'Nueva Lotería'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <XCircle size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Nombre de la Lotería</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Lotería de Medellín"
                  required
                  className="w-full px-5 py-4 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Premio COP</label>
                  <input
                    type="number"
                    value={prizeCop}
                    onChange={(e) => setPrizeCop(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-5 py-4 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Fracciones x Billete</label>
                  <input
                    type="number"
                    value={piecesPerTicket}
                    onChange={(e) => setPiecesPerTicket(e.target.value)}
                    placeholder="Ej: 3"
                    required
                    className="w-full px-5 py-4 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Precio Fracción</label>
                  <input
                    type="number"
                    value={piecePriceCop}
                    onChange={(e) => setPiecePriceCop(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-5 py-4 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Ganancia Fracción</label>
                  <input
                    type="number"
                    value={pieceProfitCop}
                    onChange={(e) => setPieceProfitCop(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-5 py-4 bg-zinc-800 border border-zinc-700 text-indigo-400 placeholder:text-zinc-600 rounded-xl font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Frecuencia</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-5 py-4 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                  >
                    <option value="daily">Diaria</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Jornada</label>
                  <select
                    value={drawTime}
                    onChange={(e) => setDrawTime(e.target.value)}
                    className="w-full px-5 py-4 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
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
