'use client';

import { useState, useEffect } from 'react';
import { 
  getAdminUsers, 
  getAdminPermissions, 
  createAdminUser, 
  toggleAdminPermission, 
  toggleAdminUserActive 
} from '@/app/actions/adminAuthActions';
import { UserPlus, Shield, Check, X, Power, XCircle } from 'lucide-react';

const PERMISSION_KEYS = [
  { key: 'view_reports', label: 'Ver Reportes' },
  { key: 'view_liquidations', label: 'Ver Liquidaciones' },
  { key: 'manage_vendors', label: 'Gestionar Vendedores' },
  { key: 'manage_assignments', label: 'Gestionar Asignaciones' },
  { key: 'export_data', label: 'Exportar Datos' },
  { key: 'view_history', label: 'Ver Historial' },
];

export default function OwnerUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [usersRes, permsRes] = await Promise.all([
      getAdminUsers(),
      getAdminPermissions()
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    if (permsRes.data) setPermissions(permsRes.data);
    setLoading(false);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    
    const result = await createAdminUser(name, email, password);
    
    if (result.success) {
      setName('');
      setEmail('');
      setPassword('');
      setIsModalOpen(false);
      fetchData();
    } else {
      alert('Error: ' + result.error);
    }
    setFormLoading(false);
  }

  async function handleTogglePermission(userId: string, permissionKey: string) {
    const existing = permissions.find(p => p.admin_user_id === userId && p.permission_key === permissionKey);
    await toggleAdminPermission(userId, permissionKey, existing?.is_enabled || false, existing?.id);
    fetchData();
  }

  async function handleToggleActive(userId: string, currentStatus: boolean) {
    await toggleAdminUserActive(userId, currentStatus);
    fetchData();
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="bg-zinc-900 px-6 py-8 border-b border-zinc-800 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Administrativos</h1>
          <p className="text-zinc-400 font-medium text-sm">Gestión de cobradores y permisos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-500 text-white p-4 rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 active:scale-95 transition-all"
        >
          <UserPlus size={24} />
        </button>
      </div>

      {/* Users List */}
      <div className="px-6 space-y-6 max-w-4xl mx-auto">
        {users.length === 0 && !loading && (
          <div className="text-center py-20 bg-zinc-900 rounded-[2.5rem] border-2 border-dashed border-zinc-800">
            <Shield className="mx-auto text-zinc-800 mb-4" size={48} />
            <p className="text-zinc-500 font-bold">No hay administrativos creados</p>
          </div>
        )}

        {users.map(user => (
          <div key={user.id} className="bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-zinc-800">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-white leading-none mb-1">{user.name}</h3>
                <p className="text-zinc-500 font-medium">{user.email}</p>
              </div>
              <button 
                onClick={() => handleToggleActive(user.id, user.is_active)}
                className={`p-4 rounded-2xl transition-all ${user.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}
              >
                <Power size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <p className="col-span-full text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Configuración de Permisos</p>
              {PERMISSION_KEYS.map(perm => {
                const pObj = permissions.find(p => p.admin_user_id === user.id && p.permission_key === perm.key);
                const isEnabled = pObj?.is_enabled;
                return (
                  <button 
                    key={perm.key}
                    onClick={() => handleTogglePermission(user.id, perm.key)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isEnabled ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
                  >
                    <span className="font-bold text-sm">{perm.label}</span>
                    {isEnabled ? <Check size={18} /> : <X size={18} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-10 border border-zinc-800 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white">Nuevo Administrativo</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <XCircle size={32} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  required
                  className="w-full px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl font-bold text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@sortex.com"
                  required
                  className="w-full px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl font-bold text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-6 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl font-bold text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={formLoading}
                className="w-full py-5 bg-indigo-500 text-white rounded-2xl font-black text-xl hover:bg-indigo-600 shadow-xl shadow-indigo-500/20 transition-all disabled:opacity-50 mt-4 active:scale-[0.98]"
              >
                {formLoading ? 'Guardando...' : 'CREAR USUARIO'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
