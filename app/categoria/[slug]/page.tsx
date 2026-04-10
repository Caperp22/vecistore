'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Link from 'next/link';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [activeSubcat, setActiveSubcat] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      const { data: catData } = await supabase.from('categories').select('*').eq('slug', slug).single();

      if (catData) {
        setCategory(catData);

        const { data: subData } = await supabase.from('subcategories').select('*').eq('category_id', catData.id).order('sort_order', { ascending: true }).order('name', { ascending: true });
        if (subData) setSubcategories(subData);
        
        const { data: prodData } = await supabase.from('products').select('*').eq('category_id', catData.id).order('created_at', { ascending: false });
        if (prodData) setProducts(prodData);
      }
      setLoading(false);
    };
    
    fetchData();

    const channel = supabase.channel('category-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => { fetchData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => { fetchData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => { fetchData(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);

  if (loading) {
    return <div className="py-32 text-center animate-pulse text-zinc-500 font-bold">Cargando catálogo...</div>;
  }

  if (!category) {
    return (
      <div className="py-32 text-center">
        <h1 className="text-3xl font-black mb-4">Categoría no encontrada 🕵️‍♂️</h1>
        <Link href="/" className="text-indigo-600 hover:underline font-bold">Volver al inicio</Link>
      </div>
    );
  }

  const activeSubcatData = activeSubcat ? subcategories.find(s => s.name === activeSubcat) : null;
  const filteredProducts = activeSubcat ? products.filter(p => p.subcategory === activeSubcat) : [];

  const bannerImageUrl = activeSubcatData?.banner_image_url || category.image_url || 'https://via.placeholder.com/1200x400?text=Portada';

  return (
    <div className="w-full pb-20 animate-in fade-in duration-500">
      
      {/* 🔥 BANNER SUPERIOR DINÁMICO MEJORADO 🔥 */}
      {/* Se aumentó la altura (h-56 sm:h-72) para que las fotos luzcan mejor */}
      <div className={`relative w-full rounded-[2.5rem] overflow-hidden mb-10 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 transition-all duration-500 ${activeSubcat ? 'h-56 sm:h-72' : 'h-64 sm:h-80'}`}>
        
        {/* CAPA 1: Fondo borroso para rellenar huecos si la foto es cuadrada o vertical */}
        <img key={`bg-${bannerImageUrl}`} src={bannerImageUrl} className="absolute inset-0 w-full h-full object-cover blur-xl opacity-60 scale-110" alt="" />
        
        {/* CAPA 2: Imagen real en object-contain para asegurar que se vea 100% COMPLETA sin recortes */}
        <img key={bannerImageUrl} src={bannerImageUrl} alt={activeSubcat ? activeSubcat : category.name} className="absolute inset-0 w-full h-full object-contain animate-in fade-in duration-500 z-0" />
        
        {/* CAPA 3: Oscurecimiento para que el texto blanco se lea bien */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-10"></div>
        
        {/* CAPA 4: El texto */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 z-20">
          <p className="text-indigo-300 font-bold tracking-widest uppercase text-xs sm:text-sm mb-2 drop-shadow-md">
            {activeSubcat ? 'Explorando subcategoría' : 'Colección principal'}
          </p>
          <h1 className="text-4xl sm:text-6xl font-black text-white drop-shadow-xl tracking-tight flex items-center gap-4">
            {category.name}
            {activeSubcat && (
              <>
                <span className="text-zinc-500 hidden sm:inline">/</span>
                <span className="text-indigo-200">{activeSubcat}</span>
              </>
            )}
          </h1>
        </div>
      </div>

      {!activeSubcat && (
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="flex items-center gap-4 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              ¿Qué estilo buscas?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {subcategories.map((sub: any) => {
              const conteo = products.filter(p => p.subcategory === sub.name).length;
              const icono = sub.icon || '✨';

              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubcat(sub.name)}
                  className="group bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-left hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex items-center gap-5 relative overflow-hidden"
                >
                  <div className="absolute -right-6 -top-6 text-8xl opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                    {icono}
                  </div>
                  
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {icono}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {sub.name}
                    </h3>
                    <p className="text-xs font-bold text-zinc-500 mt-1">
                      {conteo === 1 ? '1 producto' : `${conteo} productos`} publicados
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          
          {subcategories.length === 0 && (
             <div className="text-center py-10"><p className="text-zinc-500">Aún no hay subcategorías creadas aquí.</p></div>
          )}
        </div>
      )}

      {activeSubcat && (
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="text-3xl">{activeSubcatData?.icon || '✨'}</span> 
              Catálogo de {activeSubcat}
            </h2>
            <button onClick={() => setActiveSubcat(null)} className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 w-fit">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Volver a estilos
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#111] rounded-4xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="text-4xl opacity-50 mb-3 block">📭</span>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Aún no hay inventario aquí</h3>
              <p className="text-zinc-500 text-sm font-medium">Pronto añadiremos productos increíbles en la sección "{activeSubcat}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map(p => (
                <Link href={`/producto/${p.id}`} key={p.id} className="group flex flex-col bg-white dark:bg-[#111] border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300">
                  <div className="h-56 w-full bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden">
                    <img src={p.image_url || 'https://via.placeholder.com/400?text=Sin+Imagen'} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                  </div>
                  <div className="p-5 flex flex-col grow">
                    <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-1 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                    <p className="text-zinc-500 text-xs mb-4 line-clamp-2 leading-relaxed">{p.description}</p>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                      <span className="font-black text-xl text-zinc-900 dark:text-white">${p.price?.toLocaleString('es-CO')}</span>
                      <div className="bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold px-4 py-2 rounded-xl group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        Ver detalle
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}