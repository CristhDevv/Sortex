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
    <div className="min-h-screen p-4 sm:p-6 space-y-6" style={{ background: 'var(--bg-page)' }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Vendedores</h1>
          <p className="text-xs mt-1 uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>Gestión de equipo</p>
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
        <div className="text-center py-12 animate-pulse text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Cargando vendedores...
        </div>
      ) : (
        <div 
          className="rounded-2xl overflow-hidden shadow-2xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="divide-y divide-[var(--border)]">
            {vendors.map((vendor) => (
              <div 
                key={vendor.id} 
                className="p-4 sm:p-5 flex items-center justify-between transition-colors group"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm sm:text-base font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{vendor.name}</div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>@{vendor.alias}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-8">
                  <div className="hidden sm:block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
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
                      className="p-2 rounded-xl transition-all"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--indigo-400)'; e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                      title="Historial"
                    >
                      <History size={18} />
                    </Link>
                    <button
                      onClick={() => openEditModal(vendor)}
                      className="p-2 rounded-xl transition-all"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--indigo-400)'; e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {vendors.length === 0 && (
              <div className="p-12 text-center text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                No hay vendedores registrados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div 
            className="rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border transform transition-all animate-in fade-in zoom-in-95 duration-200"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-xl font-black mb-6 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {editingVendor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--text-muted)' }}>Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--text-muted)' }}>Alias (Usuario)</label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                  placeholder="Ej. juanp"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--text-muted)' }}>Teléfono</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                  placeholder="Ej. 123456789"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--text-muted)' }}>
                  <span>PIN (4 dígitos)</span>
                  {editingVendor && <span className="text-[9px] font-bold normal-case tracking-normal" style={{ color: 'var(--text-decorative)' }}>Dejar vacío para mantener</span>}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required={!editingVendor}
                  className="w-full px-4 py-3.5 border font-bold rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all tracking-[0.5em] text-center"
                  style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                  placeholder="••••"
                />
              </div>
              <div className="flex gap-3 mt-8 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 px-4 font-bold rounded-xl transition-colors"
                  style={{ background: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
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
