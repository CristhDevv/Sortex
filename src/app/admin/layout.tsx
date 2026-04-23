'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { adminLogout, getActiveSession } from '@/app/actions/adminAuthActions';
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
  X,
  Shield,
  Ticket,
  ShieldCheck
} from 'lucide-react';

const ADMIN_NAV = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Vendedores', href: '/admin/vendors', icon: Users },
  { name: 'Asignaciones', href: '/admin/assignments', icon: ClipboardList },
  { name: 'Reportes', href: '/admin/reports', icon: Camera },
  { name: 'Liquidaciones', href: '/admin/liquidations', icon: Calculator },
  { name: 'Historial', href: '/admin/history', icon: History },
  { name: 'Análisis', href: '/admin/analytics', icon: BarChart3 },
];

const OWNER_NAV = [
  { name: 'Mi Panel', href: '/owner/dashboard', icon: LayoutDashboard },
  { name: 'Vendedores', href: '/admin/vendors', icon: Users },
  { name: 'Asignaciones', href: '/admin/assignments', icon: ClipboardList },
  { name: 'Reportes', href: '/admin/reports', icon: Camera },
  { name: 'Liquidaciones', href: '/admin/liquidations', icon: Calculator },
  { name: 'Historial', href: '/admin/history', icon: History },
  { name: 'Análisis', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Loterías', href: '/owner/lotteries', icon: Ticket },
  { name: 'Usuarios', href: '/owner/users', icon: ShieldCheck },
  { name: 'Auditoría', href: '/owner/audit', icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<{ role: string; name: string } | null>(null);

  useEffect(() => {
    getActiveSession().then(setSession);
  }, []);

  const handleLogout = async () => {
    await adminLogout();
    router.push('/login');
    router.refresh();
  };

  const isOwner = session?.role === 'owner';
  const navItems = isOwner ? OWNER_NAV : ADMIN_NAV;
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:shadow-xl
        ${isOwner ? 'bg-zinc-950 border-r border-zinc-800' : 'bg-white border-r border-gray-100 shadow-xl'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className={`p-8 flex justify-between items-center border-b ${isOwner ? 'border-zinc-800' : 'border-gray-50'}`}>
          <div>
            <h2 className={`text-3xl font-black tracking-tighter ${isOwner ? 'text-white' : 'text-indigo-600'}`}>SORTEX</h2>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isOwner ? 'text-indigo-400' : 'text-gray-400'}`}>
              {isOwner ? 'Propietario' : 'Administración'}
            </p>
            {session?.name && (
              <p className={`text-xs font-bold mt-1 truncate ${isOwner ? 'text-zinc-400' : 'text-gray-500'}`}>
                {session.name}
              </p>
            )}
          </div>
          <button onClick={closeSidebar} className={`md:hidden ${isOwner ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-indigo-600'} transition-colors`}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 mt-4 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isOwner
                    ? isActive
                      ? 'bg-indigo-500 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    : isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                      : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : isOwner ? 'text-zinc-500 group-hover:text-white' : 'text-gray-400 group-hover:text-indigo-600'}`} />
                <span className="font-bold text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t ${isOwner ? 'border-zinc-800' : 'border-gray-50'}`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isOwner ? 'text-zinc-400 hover:bg-zinc-800 hover:text-rose-400' : 'text-gray-400 hover:bg-rose-50 hover:text-rose-600'}`}
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-bold text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <header className={`h-16 flex items-center px-6 md:hidden border-b flex-shrink-0 ${isOwner ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-100'}`}>
          <button 
            onClick={() => setSidebarOpen(true)}
            className={`p-2 -ml-2 transition-colors ${isOwner ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-indigo-600'}`}
          >
            <Menu size={24} />
          </button>
          <span className={`ml-4 font-black tracking-tighter text-xl ${isOwner ? 'text-white' : 'text-indigo-600'}`}>SORTEX</span>
        </header>
        <main className={`flex-1 p-6 md:p-10 overflow-y-auto ${isOwner ? 'bg-zinc-950' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
