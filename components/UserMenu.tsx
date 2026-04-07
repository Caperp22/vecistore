'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { useAppContext } from './Providers';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAppContext();

  // Cerrar el menú si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    // Recargar la página para limpiar los estados
    window.location.href = '/';
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón del Perfil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/30 group"
        title="Mi Cuenta"
      >
        <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>

      {/* Menú Desplegable Premium */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-2xl overflow-hidden z-50 transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
          
          {user ? (
            <>
              {/* Info del usuario logueado */}
              <div className="px-5 py-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800/60">
                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Conectado como</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {user.email}
                </p>
              </div>
              
              <div className="p-2">
                {/* Enlace al Perfil */}
                <Link 
                  href="/perfil" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <span className="mr-3 text-lg opacity-70">🛍️</span>
                  Mis Pedidos
                </Link>
                
                {/* Si es el admin, le mostramos un acceso directo */}
                {user.email === 'caperp22@gmail.com' && (
                  <Link 
                    href="/admin/dashboard" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors mt-1"
                  >
                    <span className="mr-3 text-lg opacity-70">⚙️</span>
                    Panel Administrativo
                  </Link>
                )}
                
                <div className="h-px bg-zinc-100 dark:bg-zinc-800/60 my-2 mx-2"></div>
                
                {/* Botón de Cerrar Sesión */}
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <span className="mr-3 text-lg opacity-70">🚪</span>
                  Cerrar Sesión
                </button>
              </div>
            </>
          ) : (
            // Opciones para usuarios NO logueados
            <div className="p-3">
              <Link 
                href="/login" 
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-bold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-white transition-colors shadow-sm"
              >
                Iniciar Sesión
              </Link>
              <p className="text-center text-xs text-zinc-400 mt-3 mb-1 font-medium">
                ¿Eres el administrador?
              </p>
              <Link 
                href="/admin" 
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-full px-4 py-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Acceso Admin
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}