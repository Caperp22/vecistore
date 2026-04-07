'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para el ojito
  
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Estado para abrir el candado
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsSuccess(false);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Si todo sale bien, abrimos el candado antes de redirigir
        setIsSuccess(true);
        toast.success('¡Credenciales correctas! Entrando...');
        
        setTimeout(() => {
          router.push('/carrito');
        }, 800); // Pequeña pausa para que veas el candado abierto
        
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: nombre,
              phone: telefono,
              address: direccion,
            }
          }
        });
        if (error) throw error;
        toast.success('¡Cuenta creada con éxito! 🎉');
        router.push('/carrito');
      }
      
    } catch (error: any) {
      toast.error(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4 py-10">
      <div className="bg-white dark:bg-[#111111] p-10 sm:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 dark:shadow-indigo-500/10 border border-zinc-200/60 dark:border-zinc-800/60 max-w-md w-full relative overflow-hidden transition-all duration-500">
        
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative z-10">
          <div className="mb-10 text-center">
            {/* EL CANDADO ANIMADO */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${isSuccess ? 'bg-green-100 dark:bg-green-500/20 scale-110' : 'bg-zinc-100 dark:bg-zinc-900'}`}>
              <span className="text-3xl transition-transform duration-300">
                {isSuccess ? '🔓' : '🔒'}
              </span>
            </div>
            
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
              {isLogin ? 'Ingresa para continuar con tu pedido' : 'Déjanos tus datos para el envío'}
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-5">
            
            {!isLogin && (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                <div>
                  <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-widest">Nombre Completo</label>
                  <input
                    type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-widest">WhatsApp</label>
                  <input
                    type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                    placeholder="Ej: 3001234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-widest">Dirección de Envío</label>
                  <textarea
                    required value={direccion} onChange={(e) => setDireccion(e.target.value)} rows={2}
                    className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none"
                    placeholder="Barrio, Calle, Apto..."
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-widest">Correo Electrónico</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                placeholder="tu@correo.com"
              />
            </div>
            
            <div className="relative">
              <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 mb-2 uppercase tracking-widest">Contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
              {/* EL OJITO */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 bottom-4 text-zinc-400 hover:text-indigo-500 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                )}
              </button>
            </div>

            <button
              type="submit" disabled={loading}
              className={`w-full text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg text-lg tracking-widest uppercase flex justify-center items-center gap-2 mt-6 ${loading ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed scale-95' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 dark:shadow-indigo-500/10 hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {loading ? (isSuccess ? '¡Acceso Concedido!' : 'Verificando...') : (isLogin ? 'Entrar a mi cuenta' : 'Registrarme')}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-sm transition-colors"
            >
              {isLogin ? '¿Primera vez aquí? Crea tu cuenta' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}