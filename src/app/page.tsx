import Link from 'next/link';
import { UserCog, UserCircle, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--bg-page)' }}
    >
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 
          className="text-7xl font-black tracking-tighter mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          SORTEX
        </h1>
        <p 
          className="text-xl font-medium max-w-md mx-auto leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          Sistema inteligente de gestión de lotería. Control total y simplicidad operativa.
        </p>
      </div>

      {/* Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {/* Propietario */}
        <Link 
          href="/owner/login"
          className="group p-8 rounded-[2rem] hover:border-amber-500 transition-all duration-300 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors duration-300">
            <ShieldCheck className="text-amber-500 group-hover:text-black transition-colors duration-300" size={28} />
          </div>
          <h2 
            className="text-2xl font-black mb-2 tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Propietario
          </h2>
          <p 
            className="text-sm font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            Control total del sistema, auditoría y gestión de usuarios admin.
          </p>
        </Link>

        {/* Administrador */}
        <Link 
          href="/login"
          className="group p-8 rounded-[2rem] hover:border-indigo-500 transition-all duration-300 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500 transition-colors duration-300">
            <UserCog className="text-indigo-500 group-hover:text-black transition-colors duration-300" size={28} />
          </div>
          <h2 
            className="text-2xl font-black mb-2 tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Administrador
          </h2>
          <p 
            className="text-sm font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            Gestiona vendedores, asignaciones y revisa liquidaciones diarias.
          </p>
        </Link>

        {/* Vendedor */}
        <Link 
          href="/vendor/login"
          className="group p-8 rounded-[2rem] hover:border-white transition-all duration-300 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white transition-colors duration-300">
            <UserCircle className="text-white group-hover:text-black transition-colors duration-300" size={28} />
          </div>
          <h2 
            className="text-2xl font-black mb-2 tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Vendedor
          </h2>
          <p 
            className="text-sm font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            Envía reportes diarios, consulta tus asignaciones y ve tu saldo.
          </p>
        </Link>
      </div>

      {/* Footer Decoration */}
      <div 
        className="mt-20 font-bold text-xs tracking-[0.4em] uppercase"
        style={{ color: 'var(--text-decorative)' }}
      >
        Potenciando tu negocio • 2024
      </div>
    </div>
  );
}
