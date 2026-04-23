'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserPlus, Edit2, Trash2, ShieldCheck, ShieldAlert, History } from 'lucide-react';
import { getAllVendors, createVendor, updateVendor, toggleVendorStatus } from '@/app/actions/vendorAuthActions';

interface Vendor {
  id: string;
  name: string;
  alias: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    const result = await getAllVendors();

    if ('data' in result && result.data) {
      setVendors(result.data as Vendor[]);
    } else if ('error' in result) {
      console.error(result.error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let result;
    if (editingVendor) {
      result = await updateVendor(editingVendor.id, {
        name,
        alias,
        phone,
        pin: pin || undefined
      });
    } else {
      result = await createVendor({
        name,
        alias,
        phone,
        pin
      });
    }

    if ('error' in result) {
      alert(result.error);
    } else {
      setShowModal(false);
      resetForm();
      fetchVendors();
    }
  };

  const toggleStatus = async (vendor: Vendor) => {
    const result = await toggleVendorStatus(vendor.id, vendor.is_active);

    if (!('error' in result)) {
      fetchVendors();
    } else {
      alert(result.error);
    }
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setName(vendor.name);
    setAlias(vendor.alias);
    setPhone(vendor.phone);
    setPin(''); // PIN empty unless changing
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingVendor(null);
    setName('');
    setAlias('');
    setPhone('');
    setPin('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Vendedores</h1>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-bold">Gestión de equipo</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center justify-center p-3 sm:px-4 sm:py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <UserPlus className="w-5 h-5 sm:mr-2" />
          <span className="hidden sm:inline font-bold text-sm">Nuevo Vendedor</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500 animate-pulse text-sm font-bold tracking-widest uppercase">
          Cargando vendedores...
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="divide-y divide-zinc-800">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm sm:text-base font-black text-white leading-tight">{vendor.name}</div>
                    <div className="text-xs font-bold text-zinc-500">@{vendor.alias}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-8">
                  <div className="hidden sm:block text-sm font-medium text-zinc-400">
                    {vendor.phone}
                  </div>
                  
                  <span className={`px-2.5 py-1 inline-flex text-[10px] uppercase tracking-widest font-black rounded-lg ${
                    vendor.is_active 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {vendor.is_active ? 'Activo' : 'Inactivo'}
                  </span>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => toggleStatus(vendor)}
                      className={`p-2 rounded-xl transition-all ${
                        vendor.is_active 
                          ? 'text-rose-400 hover:bg-rose-500/10' 
                          : 'text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                      title={vendor.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {vendor.is_active ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                    </button>
                    <Link
                      href={`/admin/vendors/${vendor.id}`}
                      className="p-2 rounded-xl text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                      title="Historial"
                    >
                      <History size={18} />
                    </Link>
                    <button
                      onClick={() => openEditModal(vendor)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {vendors.length === 0 && (
              <div className="p-12 text-center text-zinc-500 text-sm font-medium">
                No hay vendedores registrados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-white mb-6 tracking-tight">
              {editingVendor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700 text-white font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Alias (Usuario)</label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700 text-white font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600"
                  placeholder="Ej. juanp"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Teléfono</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700 text-white font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600"
                  placeholder="Ej. 123456789"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">
                  <span>PIN (4 dígitos)</span>
                  {editingVendor && <span className="text-[9px] text-zinc-600 font-bold normal-case tracking-normal">Dejar vacío para mantener</span>}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required={!editingVendor}
                  className="w-full px-4 py-3.5 bg-zinc-800 border border-zinc-700 text-white font-bold rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600 tracking-[0.5em] text-center"
                  placeholder="••••"
                />
              </div>
              <div className="flex gap-3 mt-8 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 px-4 bg-zinc-800 text-zinc-300 font-bold rounded-xl hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  {editingVendor ? 'Guardar Cambios' : 'Crear Vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
