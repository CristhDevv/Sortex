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
    <div className="min-h-screen pb-20" style={{ background: 'var(--bg-page)' }}>
      {/* Header */}
      <div 
        className="px-6 py-8 border-b mb-8 flex justify-between items-center"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Administrativos</h1>
          <p className="font-medium text-sm" style={{ color: 'var(--text-muted)' }}>Gestión de cobradores y permisos</p>
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
          <div 
            className="text-center py-20 rounded-[2.5rem] border-2 border-dashed"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <Shield className="mx-auto mb-4" size={48} style={{ color: 'var(--border)' }} />
            <p className="font-bold" style={{ color: 'var(--text-muted)' }}>No hay administrativos creados</p>
          </div>
        )}

        {users.map(user => (
          <div 
            key={user.id} 
            className="rounded-[2.5rem] p-8 shadow-sm border transition-all"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black leading-none mb-1" style={{ color: 'var(--text-primary)' }}>{user.name}</h3>
                <p className="font-medium" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              </div>
              <button 
                onClick={() => handleToggleActive(user.id, user.is_active)}
                className={`p-4 rounded-2xl transition-all ${user.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}
              >
                <Power size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <p className="col-span-full text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1" style={{ color: 'var(--text-muted)' }}>Configuración de Permisos</p>
              {PERMISSION_KEYS.map(perm => {
                const pObj = permissions.find(p => p.admin_user_id === user.id && p.permission_key === perm.key);
                const isEnabled = pObj?.is_enabled;
                return (
                  <button 
                    key={perm.key}
                    onClick={() => handleTogglePermission(user.id, perm.key)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isEnabled ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' : ''}`}
                    style={isEnabled ? {} : { background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-secondary)' }}
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
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div 
            className="w-full max-w-md rounded-[2.5rem] p-10 border shadow-2xl animate-in slide-in-from-bottom-8 duration-500"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Nuevo Administrativo</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <XCircle size={32} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  required
                  className="w-full px-6 py-4 border rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@sortex.com"
                  required
                  className="w-full px-6 py-4 border rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-6 py-4 border rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
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
