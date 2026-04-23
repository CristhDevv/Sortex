'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { adminLogout } from '@/app/actions/adminAuthActions';
import { 
  Users, 
  LayoutDashboard, 
  LogOut, 
  ClipboardList, 
  Camera, 
  Calculator, 
  History,
  BarChart3
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await adminLogout();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Vendedores', href: '/admin/vendors', icon: Users },
    { name: 'Asignaciones', href: '/admin/assignments', icon: ClipboardList },
    { name: 'Reportes', href: '/admin/reports', icon: Camera },
    { name: 'Liquidaciones', href: '/admin/liquidations', icon: Calculator },
    { name: 'Historial', href: '/admin/history', icon: History },
    { name: 'Análisis', href: '/admin/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl border-r border-gray-100 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <h2 className="text-3xl font-black text-indigo-600 tracking-tighter">SORTEX</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Administración</p>
        </div>
        
        <nav className="flex-1 mt-4 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'}`} />
                <span className="font-bold text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-gray-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 mr-3 text-gray-400 group-hover:text-rose-600" />
            <span className="font-bold text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
