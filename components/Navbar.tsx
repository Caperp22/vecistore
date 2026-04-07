'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import CartWidget from './CartWidget';
import UserMenu from './UserMenu';
import { useTheme } from 'next-themes';

export default function Navbar() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchCats = async () => {
      const { data } = await supabase.from('categories').select('*');
      if (data) setCategories(data);
    };
    fetchCats();
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/70 dark:bg-[#0A0A0A]/70 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo Minimalista */}
          <Link href="/" className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="bg-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">V</span>
            VeciStore.
          </Link>

          {/* MENÚ DE ESCRITORIO */}
          <div className="hidden md:flex space-x-8 items-center">
            {categories.map((cat) => (
              <Link 
                key={cat.id} 
                href={`/categoria/${cat.slug}`} 
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            
            <div className="pl-6 border-l border-zinc-200 dark:border-zinc-800 flex items-center gap-5">
              {/* Botón Dark Mode Premium */}
              {mounted && (
                <button 
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  title="Alternar Tema"
                >
                  {resolvedTheme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  )}
                </button>
              )}
              <UserMenu />
              <CartWidget />
            </div>
          </div>

          {/* BOTONES MÓVILES */}
          <div className="md:hidden flex items-center gap-4">
            <CartWidget />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
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

      {/* MENÚ MÓVIL ESTILO MINIMAL */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 absolute w-full shadow-2xl">
          <div className="px-6 pt-4 pb-8 space-y-2 flex flex-col">
            {categories.map((cat) => (
              <Link 
                key={cat.id} 
                href={`/categoria/${cat.slug}`} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-3 text-lg font-medium text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {cat.name}
              </Link>
            ))}
            
            <div className="border-t border-zinc-200 dark:border-zinc-800 mt-4 pt-6 flex flex-col gap-4">
              <UserMenu />
              {mounted && (
                <button 
                  onClick={() => { setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'); setIsMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  {resolvedTheme === 'dark' ? '🌞 Cambiar a Claro' : '🌙 Cambiar a Oscuro'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}