import { supabase } from '../lib/supabase';
import Link from 'next/link';

export const revalidate = 0; 

export default async function Home() {
  // Consultamos las categorías
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('id', { ascending: true });

  return (
    <div className="py-10">
      
      {/* HERO SECTION - Súper Minimalista y Premium */}
      <div className="relative text-center mb-20 bg-white dark:bg-[#111111] py-20 sm:py-28 rounded-[3rem] border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm overflow-hidden">
        {/* Un brillo muy sutil en el fondo */}
        <div className="absolute inset-0 bg-linear-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10 dark:to-transparent pointer-events-none" />
        
        <div className="relative z-10 px-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter mb-6">
            Dale vida a tu <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-purple-500">
              imaginación
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Explora nuestras categorías y encuentra ese detalle único y personalizado que estabas buscando.
          </p>
        </div>
      </div>

      {/* TÍTULO DE SECCIÓN */}
      <div className="flex items-center gap-4 mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
          ¿Qué estás buscando hoy?
        </h2>
      </div>

      {/* CUADRÍCULA DE CATEGORÍAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {categories?.map((cat) => (
          <Link href={`/categoria/${cat.slug}`} key={cat.id} className="block group">
            <div className="relative h-96 rounded-3xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500">
              
              {/* Imagen de fondo */}
              <img 
                src={cat.image_url || 'https://via.placeholder.com/600x800?text=Categoría'} 
                alt={cat.name} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              
              {/* Degradado oscuro para el texto */}
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
              
              {/* Contenido (Textos) */}
              <div className="absolute bottom-0 left-0 p-8 w-full z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight group-hover:text-indigo-400 transition-colors duration-300">
                  {cat.name}
                </h3>
                
                {/* Botón de "Explorar" que se desliza y revela */}
                <div className="flex items-center text-zinc-300 text-sm font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                  Explorar catálogo 
                  <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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