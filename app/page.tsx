'use client'; 

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });
      if (data) setCategories(data);
    };

    fetchCategories();

    const channel = supabase.channel('home-realtime')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'categories' }, 
        () => fetchCategories() 
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    // 🔥 CAMBIO: Eliminé el py-10 y lo hice flex para que aproveche el espacio exacto
    <div className="animate-in fade-in duration-500 h-full flex flex-col justify-center pb-2">
      
      {/* 🔥 CAMBIO: Banner mucho más compacto (py-12 y mb-8) */}
      <div className="relative text-center mb-8 bg-white dark:bg-[#111111] py-12 sm:py-16 rounded-[2.5rem] border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-linear-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10 dark:to-transparent pointer-events-none" />
        
        <div className="relative z-10 px-4">
          {/* Tamaños de fuente sutilmente reducidos */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4">
            Dale vida a tu <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-purple-500">
              imaginación
            </span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Explora nuestras categorías y encuentra ese detalle único y personalizado que estabas buscando.
          </p>
        </div>
      </div>

      {/* 🔥 CAMBIO: Título más apretado (mb-5 pb-3) */}
      <div className="flex items-center gap-4 mb-5 border-b border-zinc-200 dark:border-zinc-800 pb-3 shrink-0">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
          ¿Qué estás buscando hoy?
        </h2>
      </div>

      {/* 🔥 CAMBIO: Tarjetas más cortas (h-64 a h-72 en PC) y menor gap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full">
        {categories?.map((cat) => (
          <Link href={`/categoria/${cat.slug}`} key={cat.id} className="block group">
            <div className="relative h-64 lg:h-[17.5rem] rounded-3xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-500/10 hover:-translate-y-1.5 transition-all duration-500">
              
              <img 
                src={cat.image_url || 'https://via.placeholder.com/600x800?text=Sube+una+foto'} 
                alt={cat.name} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
              
              <div className="absolute bottom-0 left-0 p-6 w-full z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                <h3 className="text-2xl font-black text-white mb-1 tracking-tight group-hover:text-indigo-400 transition-colors duration-300 line-clamp-1">
                  {cat.name}
                </h3>
                
                <div className="flex items-center text-zinc-300 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                  Explorar catálogo 
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1.5 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>

            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}