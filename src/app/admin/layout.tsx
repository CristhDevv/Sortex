'use client';

import { useState } from 'react';
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
  BarChart3,
  Menu,
  X
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl border-r border-gray-100 flex flex-col 
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-indigo-600 tracking-tighter">SORTEX</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Administración</p>
          </div>
          <button onClick={closeSidebar} className="md:hidden text-gray-400 hover:text-indigo-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 mt-4 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
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
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Mobile Header */}
        <header className="h-16 flex items-center px-6 md:hidden bg-white border-b border-gray-100 flex-shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 font-black text-indigo-600 tracking-tighter text-xl">SORTEX</span>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
