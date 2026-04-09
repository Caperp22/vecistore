'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import CartWidget from './CartWidget';
import UserMenu from './UserMenu';
import { useTheme } from 'next-themes';
import NotificationBell from './NotificationBell';
// 🔥 1. IMPORTA EL NUEVO COMPONENTE
import CartDrawer from './CartDrawer';

export default function Navbar() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const fetchCats = async () => {
      const { data } = await supabase.from('categories').select('*').order('id', { ascending: true });
      if (data) setCategories(data);
    };
    fetchCats();
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/70 dark:bg-[#0A0A0A]/70 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-500">
      {/* ... [ TODO EL CÓDIGO DE TU NAVBAR SE QUEDA EXACTAMENTE IGUAL ] ... */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <Link href="/" className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="bg-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">V</span>
            <span className="hidden xs:block">VeciStore.</span>
          </Link>

          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/" className={`text-sm font-bold transition-colors ${pathname === '/' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>
              Inicio
            </Link>

            {categories.map((cat) => {
              const rutaCategoria = `/categoria/${cat.slug}`;
              const estaActiva = pathname === rutaCategoria;
              return (
                <Link key={cat.id} href={rutaCategoria} className={`text-sm font-bold transition-colors ${estaActiva ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>
                  {cat.name}
                </Link>
              );
            })}
            
            <div className="pl-6 border-l border-zinc-200 dark:border-zinc-800 flex items-center gap-5">
              {mounted && (
                <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                  {resolvedTheme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  )}
                </button>
              )}
              <NotificationBell />
              <UserMenu />
              <CartWidget />
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <div className="flex items-center gap-1 mr-2 border-r border-zinc-200 dark:border-zinc-800 pr-2">
              {mounted && (
                <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="p-2 text-zinc-500 dark:text-zinc-400">
                  {resolvedTheme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  )}
                </button>
              )}
              <NotificationBell />
            </div>

            <div className="flex items-center gap-1">
              <UserMenu />
              <CartWidget />
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="ml-1 p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 absolute w-full shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="px-6 py-8 space-y-2">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Menú de Navegación</p>
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={`block py-3 text-xl font-black transition-colors ${pathname === '/' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
              Inicio
            </Link>
            {categories.map((cat) => {
              const rutaCategoria = `/categoria/${cat.slug}`;
              const estaActiva = pathname === rutaCategoria;
              return (
                <Link key={cat.id} href={rutaCategoria} onClick={() => setIsMobileMenuOpen(false)} className={`block py-3 text-xl font-bold transition-colors ${estaActiva ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 🔥 2. COLOCAMOS EL DRAWER AL FINAL DEL NAVBAR */}
      <CartDrawer />
    </nav>
  );
}