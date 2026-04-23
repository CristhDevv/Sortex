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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-8 border-b border-gray-100 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Administrativos</h1>
          <p className="text-gray-500 font-medium">Gestión de cobradores y permisos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <UserPlus size={24} />
        </button>
      </div>

      {/* Users List */}
      <div className="px-6 space-y-6">
        {users.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <Shield className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 font-bold">No hay administrativos creados</p>
          </div>
        )}

        {users.map(user => (
          <div key={user.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">{user.name}</h3>
                <p className="text-gray-400 font-medium">{user.email}</p>
              </div>
              <button 
                onClick={() => handleToggleActive(user.id, user.is_active)}
                className={`p-4 rounded-2xl transition-all ${user.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
              >
                <Power size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Configuración de Permisos</p>
              {PERMISSION_KEYS.map(perm => {
                const pObj = permissions.find(p => p.admin_user_id === user.id && p.permission_key === perm.key);
                const isEnabled = pObj?.is_enabled;
                return (
                  <button 
                    key={perm.key}
                    onClick={() => handleTogglePermission(user.id, perm.key)}
                    className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${isEnabled ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 border-transparent text-gray-400'}`}
                  >
                    <span className="font-bold">{perm.label}</span>
                    {isEnabled ? <Check size={20} /> : <X size={20} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900">Nuevo Administrativo</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={32} /></button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-6">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo"
                required
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-100 border-none transition-all"
              />
              <button 
                type="submit"
                disabled={formLoading}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50"
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
