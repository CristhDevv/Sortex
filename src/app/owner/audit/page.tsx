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
    <div className="min-h-screen pb-20" style={{ background: 'var(--bg-page)' }}>
      {/* Header */}
      <div 
        className="px-6 py-8 border-b mb-8"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Auditoría</h1>
            <p className="font-medium text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Registro de todas las acciones críticas del sistema</p>
          </div>
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <Shield className="text-indigo-400" size={28} />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Rol</label>
            <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="border rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50"
                style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
            >
              <option value="all">Todos</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Acción</label>
            <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="border rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50"
                style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
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
          <div className="text-center py-20 font-bold animate-pulse" style={{ color: 'var(--text-decorative)' }}>Cargando registros...</div>
        ) : logs.length === 0 ? (
          <div 
            className="text-center py-24 rounded-3xl border-2 border-dashed"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <Shield className="mx-auto mb-4" size={48} style={{ color: 'var(--border)' }} />
            <p className="font-bold" style={{ color: 'var(--text-muted)' }}>No hay registros para esta selección</p>
          </div>
        ) : (
          logs.map((log) => (
            <div 
              key={log.id} 
              className="rounded-2xl p-5 border transition-all"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div 
                    className="p-2.5 rounded-xl flex-shrink-0"
                    style={{ background: 'var(--bg-card-hover)' }}
                  >
                    <User size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{log.actor_name}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-decorative)' }}>{log.actor_role}</span>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border ${ACTION_COLORS[log.action] || ''}`} style={ACTION_COLORS[log.action] ? {} : { background: 'var(--bg-card-hover)', color: 'var(--text-secondary)', borderColor: 'var(--border-hover)' }}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                    {log.metadata && (
                      <p className="text-xs mt-2 font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold flex-shrink-0" style={{ color: 'var(--text-decorative)' }}>
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
