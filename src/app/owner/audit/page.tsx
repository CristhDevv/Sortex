'use client';
import { useEffect, useState } from 'react';
import { getAuditLogs } from '@/app/actions/auditActions';
import { Shield, User, Clock, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ACTION_LABELS: Record<string, string> = {
  owner_login: 'Inicio de sesión (owner)',
  admin_login: 'Inicio de sesión (admin)',
  admin_user_created: 'Admin creado',
  admin_user_activated: 'Admin activado',
  admin_user_deactivated: 'Admin desactivado',
  permission_changed: 'Permiso modificado',
  vendor_created: 'Vendedor creado',
  vendor_updated: 'Vendedor editado',
  vendor_activated: 'Vendedor activado',
  vendor_deactivated: 'Vendedor desactivado',
  assignment_created: 'Asignación creada',
  assignment_deleted: 'Asignación eliminada',
  liquidation_processed: 'Liquidación procesada',
};

const ACTION_COLORS: Record<string, string> = {
  owner_login: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  admin_login: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  admin_user_created: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  admin_user_activated: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  admin_user_deactivated: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  permission_changed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  vendor_created: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  vendor_updated: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  vendor_activated: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  vendor_deactivated: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  assignment_created: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  assignment_deleted: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  liquidation_processed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [filterRole, filterAction]);

  async function fetchLogs() {
    setLoading(true);
    const data = await getAuditLogs({
      limit: 100,
      actor_role: filterRole !== 'all' ? filterRole : undefined,
      action: filterAction !== 'all' ? filterAction : undefined,
    });
    setLogs(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="bg-zinc-900 px-6 py-8 border-b border-zinc-800 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Auditoría</h1>
            <p className="text-zinc-400 font-medium text-sm mt-1">Registro de todas las acciones críticas del sistema</p>
          </div>
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <Shield className="text-indigo-400" size={28} />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Rol</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-zinc-800 text-white border border-zinc-700 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="all">Todos</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Acción</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-zinc-800 text-white border border-zinc-700 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="all">Todas</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="px-6 space-y-3 max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-20 text-zinc-600 font-bold animate-pulse">Cargando registros...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-800">
            <Shield className="mx-auto text-zinc-800 mb-4" size={48} />
            <p className="text-zinc-500 font-bold">No hay registros para esta selección</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="p-2.5 bg-zinc-800 rounded-xl flex-shrink-0">
                    <User size={18} className="text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-black text-white text-sm">{log.actor_name}</span>
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{log.actor_role}</span>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border ${ACTION_COLORS[log.action] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                    {log.metadata && (
                      <p className="text-zinc-500 text-xs mt-2 font-mono truncate">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-600 text-xs font-bold flex-shrink-0">
                  <Clock size={12} />
                  {format(new Date(log.created_at), "d MMM, HH:mm", { locale: es })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
