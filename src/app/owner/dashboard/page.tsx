'use client';

import Link from 'next/link';
import { 
  Users, 
  ClipboardList, 
  BarChart3, 
  Wallet, 
  History, 
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';

export default function OwnerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-8 border-b border-gray-100 mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">¡Hola, Propietario! 👋</h1>
        <p className="text-gray-500 font-medium">Resumen general de Sortex hoy</p>
      </div>

      {/* Metrics Grid */}
      <div className="px-6 grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <Users className="text-indigo-600 mb-3" size={24} />
          <div className="text-2xl font-black text-gray-900">0</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vendedores</div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <ClipboardList className="text-indigo-600 mb-3" size={24} />
          <div className="text-2xl font-black text-gray-900">0</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reportes Hoy</div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <Wallet className="text-indigo-600 mb-3" size={24} />
          <div className="text-2xl font-black text-gray-900">0</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pendientes</div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <BarChart3 className="text-indigo-600 mb-3" size={24} />
          <div className="text-2xl font-black text-gray-900">$0</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recaudado</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="px-6 space-y-4">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-4">Gestión Central</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/vendors" className="flex items-center p-6 bg-white rounded-3xl border border-gray-100 hover:border-indigo-600 transition-all group">
            <Users className="text-gray-400 group-hover:text-indigo-600 mr-4" size={24} />
            <span className="font-bold text-gray-700">Vendedores</span>
          </Link>
          <Link href="/admin/assignments" className="flex items-center p-6 bg-white rounded-3xl border border-gray-100 hover:border-indigo-600 transition-all group">
            <ClipboardList className="text-gray-400 group-hover:text-indigo-600 mr-4" size={24} />
            <span className="font-bold text-gray-700">Asignaciones</span>
          </Link>
          <Link href="/admin/reports" className="flex items-center p-6 bg-white rounded-3xl border border-gray-100 hover:border-indigo-600 transition-all group">
            <BarChart3 className="text-gray-400 group-hover:text-indigo-600 mr-4" size={24} />
            <span className="font-bold text-gray-700">Reportes</span>
          </Link>
          <Link href="/admin/liquidations" className="flex items-center p-6 bg-white rounded-3xl border border-gray-100 hover:border-indigo-600 transition-all group">
            <Wallet className="text-gray-400 group-hover:text-indigo-600 mr-4" size={24} />
            <span className="font-bold text-gray-700">Liquidaciones</span>
          </Link>
          <Link href="/admin/history" className="flex items-center p-6 bg-white rounded-3xl border border-gray-100 hover:border-indigo-600 transition-all group">
            <History className="text-gray-400 group-hover:text-indigo-600 mr-4" size={24} />
            <span className="font-bold text-gray-700">Historial</span>
          </Link>
          <Link href="/owner/users" className="flex items-center p-6 bg-indigo-50 rounded-3xl border border-indigo-100 hover:border-indigo-600 transition-all group">
            <ShieldCheck className="text-indigo-600 mr-4" size={24} />
            <span className="font-bold text-indigo-900">Usuarios y Permisos</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
