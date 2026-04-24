'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { adminLogout, getActiveSession } from '@/app/actions/adminAuthActions';
import { useTheme } from '@/context/ThemeContext';
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
  ShieldCheck,
  Sun,
  Moon
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getActiveSession().then(setSession);
  }, []);

  const handleLogout = async () => {
    await adminLogout();
    router.push('/login');
    router.refresh();
  };

  const isOwner = session?.role === 'owner';
  const { theme, toggleTheme } = useTheme();
  const navItems = isOwner ? OWNER_NAV : ADMIN_NAV;
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ background: 'var(--bg-page)' }}>
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
        md:relative md:translate-x-0 border-r
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="p-8 flex justify-between items-center border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-3xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>SORTEX</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
              {isOwner ? 'Propietario' : 'Administración'}
            </p>
            {session?.name && (
              <p className="text-xs font-bold mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                {session.name}
              </p>
            )}
          </div>
          <button 
            onClick={closeSidebar} 
            className="md:hidden transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
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
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-indigo-500 text-white' : ''}`}
                style={isActive ? {} : { color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-card-hover)'; if (!isActive) e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                <Icon className="w-5 h-5 mr-3 transition-colors" style={isActive ? { color: 'white' } : { color: 'var(--text-muted)' }} />
                <span className="font-bold text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 mb-1"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            {mounted ? (theme === 'dark' ? <Moon className="w-5 h-5 mr-3" /> : <Sun className="w-5 h-5 mr-3" />) : <span className="w-5 h-5 mr-3" />}
            <span className="font-bold text-sm">
              {mounted ? (theme === 'dark' ? 'Modo oscuro' : 'Modo claro') : 'Cargando...'}
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text-rose-400)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-bold text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <header 
          className="h-16 flex items-center px-6 md:hidden border-b flex-shrink-0"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 font-black tracking-tighter text-xl" style={{ color: 'var(--text-primary)' }}>SORTEX</span>
        </header>
        <main className="flex-1 p-6 md:p-10 overflow-y-auto" style={{ background: 'var(--bg-page)' }}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
