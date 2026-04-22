'use client';

import { useState } from 'react';
import { vendorLogin } from '@/app/actions/vendorAuthActions';
import { useRouter } from 'next/navigation';
import { User, Lock, AlertCircle } from 'lucide-react';

export default function VendorLoginPage() {
  const [alias, setAlias] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await vendorLogin(alias, pin);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/vendor/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-600 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 transform transition-all">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-indigo-600 tracking-tight">SORTEX</h1>
          <p className="text-gray-500 mt-2 font-medium">Portal de Vendedores</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100 flex items-center animate-shake">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="relative">
              <User className="absolute left-4 top-4 text-gray-400 w-6 h-6" />
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value.toLowerCase())}
                required
                autoCapitalize="none"
                className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-xl font-semibold text-gray-900 focus:ring-4 focus:ring-indigo-100 placeholder-gray-400 transition-all"
                placeholder="Tu alias / usuario"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-4 text-gray-400 w-6 h-6" />
              <input
                type="password"
                maxLength={4}
                pattern="\d{4}"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-2xl font-black tracking-[0.5em] text-gray-900 focus:ring-4 focus:ring-indigo-100 placeholder-gray-400 transition-all"
                placeholder="PIN"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'INGRESAR'}
          </button>
        </form>
        
        <p className="text-center text-gray-400 mt-10 text-sm">
          Si olvidaste tu PIN, contacta al administrador.
        </p>
      </div>
    </div>
  );
}
