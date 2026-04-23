import Link from 'next/link';
import { UserCog, UserCircle, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-7xl font-black text-white tracking-tighter mb-4">
          SORTEX
        </h1>
        <p className="text-xl text-zinc-400 font-medium max-w-md mx-auto leading-relaxed">
          Sistema inteligente de gestión de lotería. Control total y simplicidad operativa.
        </p>
      </div>

      {/* Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {/* Propietario */}
        <Link 
          href="/owner/login"
          className="group bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] hover:border-amber-500 transition-all duration-300"
        >
          <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors duration-300">
            <ShieldCheck className="text-amber-500 group-hover:text-zinc-950 transition-colors duration-300" size={28} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Propietario</h2>
          <p className="text-zinc-500 text-sm font-medium">Control total del sistema, auditoría y gestión de usuarios admin.</p>
        </Link>

        {/* Administrador */}
        <Link 
          href="/login"
          className="group bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] hover:border-indigo-500 transition-all duration-300"
        >
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500 transition-colors duration-300">
            <UserCog className="text-indigo-500 group-hover:text-zinc-950 transition-colors duration-300" size={28} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Administrador</h2>
          <p className="text-zinc-500 text-sm font-medium">Gestiona vendedores, asignaciones y revisa liquidaciones diarias.</p>
        </Link>

        {/* Vendedor */}
        <Link 
          href="/vendor/login"
          className="group bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] hover:border-white transition-all duration-300"
        >
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white transition-colors duration-300">
            <UserCircle className="text-white group-hover:text-zinc-950 transition-colors duration-300" size={28} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Vendedor</h2>
          <p className="text-zinc-500 text-sm font-medium">Envía reportes diarios, consulta tus asignaciones y ve tu saldo.</p>
        </Link>
      </div>

      {/* Footer Decoration */}
      <div className="mt-20 text-zinc-600 font-bold text-xs tracking-[0.4em] uppercase">
        Potenciando tu negocio • 2024
      </div>
    </div>
  );
}
