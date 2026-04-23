'use client';

import { useState } from 'react';
import { adminLogin } from '@/app/actions/adminAuthActions';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await adminLogin(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      if (result.role === 'owner') {
        router.push('/owner/dashboard');
      } else {
        router.push('/admin');
      }
      // Force a refresh to ensure middleware sees the new session cookies
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl p-8 sm:p-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight">SORTEX</h1>
          <p className="text-zinc-500 mt-2 font-black uppercase tracking-widest text-[10px] sm:text-xs">Panel de Administración</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-sm border border-rose-500/20 font-bold text-center animate-pulse">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full px-5 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl text-base sm:text-lg font-bold text-white focus:ring-2 focus:ring-indigo-500 placeholder-zinc-600 transition-all outline-none"
              placeholder="admin@sortex.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest ml-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full px-5 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl text-base sm:text-lg font-bold text-white focus:ring-2 focus:ring-indigo-500 placeholder-zinc-600 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-indigo-500 text-white rounded-2xl text-lg sm:text-xl font-black hover:bg-indigo-600 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 tracking-wide mt-4"
          >
            {loading ? 'INICIANDO SESIÓN...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
}
