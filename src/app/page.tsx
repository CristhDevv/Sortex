import Link from 'next/link';
import { UserCog, UserCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-7xl font-black text-indigo-600 tracking-tighter mb-4">
          SORTEX
        </h1>
        <p className="text-xl text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
          Sistema inteligente de gestión de lotería. Control total para administradores y simplicidad para vendedores.
        </p>
      </div>

      {/* Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl animate-in fade-in zoom-in duration-1000 delay-200">
        <Link 
          href="/login"
          className="group relative bg-white border-2 border-gray-100 p-8 rounded-[2.5rem] hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <UserCog size={120} className="text-indigo-600" />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors duration-500">
              <UserCog className="text-indigo-600 group-hover:text-white transition-colors duration-500" size={32} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Soy Administrador</h2>
            <p className="text-gray-500 font-medium">Gestiona vendedores, asignaciones y revisa liquidaciones diarias.</p>
          </div>
        </Link>

        <Link 
          href="/vendor/login"
          className="group relative bg-white border-2 border-gray-100 p-8 rounded-[2.5rem] hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <UserCircle size={120} className="text-indigo-600" />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors duration-500">
              <UserCircle className="text-indigo-600 group-hover:text-white transition-colors duration-500" size={32} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Soy Vendedor</h2>
            <p className="text-gray-500 font-medium">Envía tus reportes diarios, consulta tus asignaciones y ve tu saldo.</p>
          </div>
        </Link>
      </div>

      {/* Footer Decoration */}
      <div className="mt-20 text-gray-300 font-bold text-sm tracking-[0.3em] uppercase">
        Potenciando tu negocio
      </div>
    </div>
  );
}
