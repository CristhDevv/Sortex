'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  Users, ClipboardList, BarChart3, Wallet, 
  History, ShieldCheck, Ticket, Shield,
  ChevronRight, Camera
} from 'lucide-react';
import { getActiveSession } from '@/app/actions/adminAuthActions';

const NAV_ITEMS = [
  { href: '/admin/vendors', icon: Users, label: 'Vendedores', desc: 'Gestión de cobradores' },
  { href: '/admin/assignments', icon: ClipboardList, label: 'Asignaciones', desc: 'Asignaciones del día' },
  { href: '/admin/reports', icon: Camera, label: 'Reportes', desc: 'Fotos y auditoría' },
  { href: '/admin/liquidations', icon: Wallet, label: 'Liquidaciones', desc: 'Revisión de cobros' },
  { href: '/admin/history', icon: History, label: 'Historial', desc: 'Registro histórico' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Análisis', desc: 'Ganancias y métricas' },
  { href: '/owner/lotteries', icon: Ticket, label: 'Loterías', desc: 'Configuración de loterías' },
  { href: '/owner/users', icon: ShieldCheck, label: 'Usuarios', desc: 'Admins y permisos' },
  { href: '/owner/audit', icon: Shield, label: 'Auditoría', desc: 'Registro de acciones' },
];

export default function OwnerDashboard() {
  const [name, setName] = useState('');

  useEffect(() => {
    getActiveSession().then(s => { if (s?.name) setName(s.name); });
  }, []);

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--bg-page)' }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Propietario</p>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{name || 'Panel General'}</h1>
      </div>

      {/* KPIs — fila compacta */}
      <div className="grid grid-cols-4 gap-px border-b" style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border)' }}>
        {[
          { label: 'Vendedores', value: '—' },
          { label: 'Reportes hoy', value: '—' },
          { label: 'Pendientes', value: '—' },
          { label: 'Ganancia hoy', value: '—' },
        ].map((kpi) => (
          <div key={kpi.label} className="px-4 py-5 text-center" style={{ background: 'var(--bg-page)' }}>
            <div className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{kpi.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Nav list */}
      <div className="mt-6 px-4">
        <p className="text-[10px] font-black uppercase tracking-widest mb-3 ml-2" style={{ color: 'var(--text-decorative)' }}>Módulos</p>
        <div 
          className="rounded-2xl overflow-hidden border divide-y divide-[var(--border)]" 
          style={{ borderColor: 'var(--border)' }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-4 py-4 transition-colors group"
                style={{ background: 'var(--bg-card)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card)' }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-9 h-9 rounded-xl group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors flex-shrink-0"
                    style={{ background: 'var(--bg-card-hover)' }}
                  >
                    <Icon size={18} className="transition-colors" style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{item.label}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                </div>
                <ChevronRight size={16} className="transition-colors flex-shrink-0" style={{ color: 'var(--text-decorative)' }} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
