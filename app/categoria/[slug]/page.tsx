'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Link from 'next/link';

// 🔥 DICCIONARIO DE SUBCATEGORÍAS (Igual al del administrador)
const SUBCATEGORIAS_MAP: Record<string, string[]> = {
  'Amigurumis': ['Personajes', 'Animales', 'Llaveros', 'Gorros', 'Personalizados', 'Otros'],
  'Impresión 3D': ['Figuras', 'Macetas', 'Mecánicos', 'Accesorios', 'Repuestos', 'Otros'],
  'Manualidades': ['Resina', 'Papelería', 'Arcilla', 'Tela', 'Pintura', 'Otros'],
  'Hama Beads': ['Llaveros', 'Imanes', 'Cuadros', 'Posavasos', 'Figuras', 'Otros']
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para saber qué subcategoría está seleccionada
  const [activeSubcat, setActiveSubcat] = useState('Todas');

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      
      // 1. Buscamos la categoría por su "slug" (ej: 'amigurumis')
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (catData) {
        setCategory(catData);
        
        // 2. Buscamos todos los productos que pertenezcan a esta categoría
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', catData.id)
          .order('created_at', { ascending: false });
          
        if (prodData) setProducts(prodData);
      }
      setLoading(false);
    };
    
    fetchData();
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

  // Obtenemos la lista de subcategorías que le tocan a esta categoría
  const subcategorias = SUBCATEGORIAS_MAP[category.name] || [];

  // Filtramos los productos según el botón seleccionado
  const filteredProducts = activeSubcat === 'Todas' 
    ? products 
    : products.filter(p => p.subcategory === activeSubcat);

  return (
    <div className="w-full pb-20 animate-in fade-in duration-500">
      
      {/* 🌟 HERO SECTION (Portada de la Categoría) */}
      <div className="relative h-64 sm:h-80 w-full rounded-[2.5rem] overflow-hidden mb-10 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
        <img 
          src={category.image_url || 'https://via.placeholder.com/1200x400?text=Portada'} 
          alt={category.name} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Degradado para que el texto resalte */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 z-10">
          <p className="text-indigo-400 font-bold tracking-widest uppercase text-xs sm:text-sm mb-3 drop-shadow-md">
            Explora nuestra colección de
          </p>
          <h1 className="text-4xl sm:text-6xl font-black text-white drop-shadow-xl tracking-tight">
            {category.name}
          </h1>
        </div>
      </div>

      {/* 🎛️ BARRA DE FILTROS DE SUBCATEGORÍAS */}
      {subcategorias.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
            <button
              onClick={() => setActiveSubcat('Todas')}
              className={`snap-start whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all border-2 ${
                activeSubcat === 'Todas' 
                  ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-black shadow-md' 
                  : 'bg-transparent border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700'
              }`}
            >
              Todas
            </button>
            
            {subcategorias.map((sub: string) => (
              <button
                key={sub}
                onClick={() => setActiveSubcat(sub)}
                className={`snap-start whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all border-2 ${
                  activeSubcat === sub 
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm' 
                    : 'bg-transparent border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 📦 CUADRÍCULA DE PRODUCTOS */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800">
          <span className="text-4xl opacity-50 mb-3 block">👻</span>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">¡Ups! Aún no hay productos aquí</h3>
          <p className="text-zinc-500 text-sm font-medium">
            Pronto añadiremos cosas increíbles en "{activeSubcat}".
          </p>
          {activeSubcat !== 'Todas' && (
            <button 
              onClick={() => setActiveSubcat('Todas')}
              className="mt-4 text-indigo-600 font-bold hover:underline"
            >
              Ver todo el catálogo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <Link href={`/producto/${p.id}`} key={p.id} className="group flex flex-col bg-white dark:bg-[#111] border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300">
              
              <div className="h-56 w-full bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden">
                <img 
                  src={p.image_url || 'https://via.placeholder.com/400?text=Sin+Imagen'} 
                  alt={p.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" 
                />
                {p.subcategory && (
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/90 backdrop-blur-md text-zinc-900 dark:text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm">
                    {p.subcategory}
                  </div>
                )}
              </div>
              
              <div className="p-5 flex flex-col flex-grow">
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
  );
}