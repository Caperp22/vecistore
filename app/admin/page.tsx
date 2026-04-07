'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Le añadimos un estado de carga visual
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true); // El botón dirá "Autenticando..."

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciales incorrectas. Intenta de nuevo.');
      setIsLoading(false);
    } else {
      router.push('/admin/dashboard'); 
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4">
      {/* TARJETA DE LOGIN PREMIUM */}
      <div className="bg-white dark:bg-[#111111] p-10 sm:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 dark:shadow-indigo-500/10 border border-zinc-200/60 dark:border-zinc-800/60 max-w-md w-full relative overflow-hidden">
        
        {/* Brillo decorativo sutil en la esquina superior */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative z-10">
          
          {/* Encabezado */}
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🔐</span>
            </div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              Acceso Admin
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
              Ingresa a tu centro de mando
            </p>
          </div>
          
          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-widest">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                placeholder="admin@vecistore.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-widest">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Mensaje de Error Estilizado */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-bold text-center border border-red-100 dark:border-red-900/50">
                {error}
              </div>
            )}

            {/* Botón Animado */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-black py-4 px-6 rounded-2xl transition-all shadow-lg text-lg uppercase tracking-widest flex justify-center items-center gap-2 ${
                isLoading 
                  ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed scale-95' 
                  : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isLoading ? 'Autenticando...' : 'Entrar al Panel'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}