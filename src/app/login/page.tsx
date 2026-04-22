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
      router.push('/admin');
      // Force a refresh to ensure middleware sees the new session cookies
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 transform transition-all">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-indigo-600 tracking-tight">SORTEX</h1>
          <p className="text-gray-500 mt-2 font-medium">Panel de Administración</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100 animate-shake">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-lg font-semibold text-gray-900 focus:ring-4 focus:ring-indigo-100 placeholder-gray-400 transition-all"
              placeholder="admin@sortex.com"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest ml-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-lg font-semibold text-gray-900 focus:ring-4 focus:ring-indigo-100 placeholder-gray-400 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
}
