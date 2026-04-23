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
    <div className="min-h-screen bg-zinc-950 pb-10">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-zinc-800">
        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Propietario</p>
        <h1 className="text-2xl font-black text-white tracking-tight">{name || 'Panel General'}</h1>
      </div>

      {/* KPIs — fila compacta */}
      <div className="grid grid-cols-4 gap-px bg-zinc-800 border-b border-zinc-800">
        {[
          { label: 'Vendedores', value: '—' },
          { label: 'Reportes hoy', value: '—' },
          { label: 'Pendientes', value: '—' },
          { label: 'Ganancia hoy', value: '—' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-zinc-950 px-4 py-5 text-center">
            <div className="text-xl font-black text-white">{kpi.value}</div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Nav list */}
      <div className="mt-6 px-4">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 ml-2">Módulos</p>
        <div className="rounded-2xl overflow-hidden border border-zinc-800 divide-y divide-zinc-800">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-4 py-4 bg-zinc-900 hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors flex-shrink-0">
                    <Icon size={18} className="text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white leading-tight">{item.label}</div>
                    <div className="text-xs text-zinc-500">{item.desc}</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
