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
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-page)' }}
    >
      <div 
        className="max-w-md w-full rounded-3xl border shadow-2xl p-8 sm:p-10"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>SORTEX</h1>
          <p 
            className="mt-2 font-black uppercase tracking-widest text-[10px] sm:text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Portal de Vendedores
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-sm border border-rose-500/20 font-bold flex items-center justify-center animate-pulse">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value.toLowerCase())}
                required
                autoCapitalize="none"
                className="block w-full pl-12 pr-4 py-4 border rounded-2xl text-lg font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                placeholder="Tu alias / usuario"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6" style={{ color: 'var(--text-muted)' }} />
              <input
                type="password"
                maxLength={4}
                pattern="\d{4}"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                className="block w-full pl-12 pr-4 py-4 border rounded-2xl text-2xl font-black tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-hover)', color: 'var(--text-primary)' }}
                placeholder="PIN"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-indigo-500 text-white rounded-2xl text-lg sm:text-xl font-black hover:bg-indigo-600 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 tracking-wide mt-4"
          >
            {loading ? 'ENTRANDO...' : 'INGRESAR'}
          </button>
        </form>
        
        <p className="text-center mt-8 text-xs font-bold tracking-wide" style={{ color: 'var(--text-decorative)' }}>
          Si olvidaste tu PIN, contacta al administrador.
        </p>
      </div>
    </div>
  );
}
