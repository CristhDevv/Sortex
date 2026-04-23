'use client';

import { useState, useEffect } from 'react';
import { 
  getLotteries, 
  createLottery, 
  updateLottery, 
  toggleLotteryActive 
} from '@/app/actions/lotteryActions';
import { Plus, Power, Edit3, XCircle, Ticket, Coins, Percent, Clock, Calendar } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-8 border-b border-gray-100 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Loterías</h1>
          <p className="text-gray-500 font-medium">Configuración de sorteos y premios</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Lotteries List */}
      <div className="px-6 space-y-6">
        {lotteries.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <Ticket className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 font-bold">No hay loterías configuradas</p>
          </div>
        )}

        {lotteries.map(lottery => (
          <div key={lottery.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900 leading-none mb-2">{lottery.name}</h3>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${lottery.frequency === 'daily' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {lottery.frequency === 'daily' ? 'Diaria' : 'Mensual'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${lottery.draw_time === 'midday' ? 'bg-amber-50 text-amber-600' : 'bg-slate-800 text-white'}`}>
                    {lottery.draw_time === 'midday' ? 'Mediodía' : 'Noche'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(lottery)}
                  className="p-4 rounded-2xl bg-gray-50 text-gray-400 hover:text-indigo-600 transition-all"
                >
                  <Edit3 size={24} />
                </button>
                <button 
                  onClick={() => handleToggleActive(lottery.id, lottery.is_active)}
                  className={`p-4 rounded-2xl transition-all ${lottery.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                >
                  <Power size={24} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Premio Mayor</p>
                <p className="text-xl font-black text-gray-900">${lottery.prize_cop.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fracciones</p>
                <p className="text-xl font-black text-gray-900">{lottery.pieces_per_ticket}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Precio x Frac.</p>
                <p className="text-xl font-black text-gray-900">${lottery.piece_price_cop.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ganancia x Frac.</p>
                <p className="text-xl font-black text-indigo-600">${lottery.piece_profit_cop.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 animate-in slide-in-from-bottom-8 duration-500 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900">
                {editingLottery ? 'Editar Lotería' : 'Nueva Lotería'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={32} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Nombre de la Lotería</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Lotería de Medellín"
                  required
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Premio COP</label>
                  <input
                    type="number"
                    value={prizeCop}
                    onChange={(e) => setPrizeCop(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Fracciones x Billete</label>
                  <input
                    type="number"
                    value={piecesPerTicket}
                    onChange={(e) => setPiecesPerTicket(e.target.value)}
                    placeholder="Ej: 3"
                    required
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Precio Fracción</label>
                  <input
                    type="number"
                    value={piecePriceCop}
                    onChange={(e) => setPiecePriceCop(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Ganancia Fracción</label>
                  <input
                    type="number"
                    value={pieceProfitCop}
                    onChange={(e) => setPieceProfitCop(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all text-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Frecuencia</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all appearance-none"
                  >
                    <option value="daily">Diaria</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Jornada</label>
                  <select
                    value={drawTime}
                    onChange={(e) => setDrawTime(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all appearance-none"
                  >
                    <option value="midday">Mediodía</option>
                    <option value="night">Noche</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={formLoading}
                className="w-full mt-4 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50"
              >
                {formLoading ? 'Guardando...' : editingLottery ? 'ACTUALIZAR LOTERÍA' : 'CREAR LOTERÍA'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
