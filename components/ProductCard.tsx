'use client';

import { useState } from 'react';
import { useAppContext } from './Providers';

export default function ProductCard({ product }: { product: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart, toggleFavorite, favorites } = useAppContext();
  
  const isFav = favorites.some((f) => f.id === product.id);

  // Imagen por defecto si el producto no tiene una válida en Supabase
  const imagenSegura = product.image_url || 'https://images.unsplash.com/photo-1555661530-68c8e968abea?q=80&w=600&auto=format&fit=crop';

  return (
    <>
      {/* TARJETA MINIMALISTA */}
      <div className="bg-white dark:bg-[#111111] rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
        
        {/* Contenedor estricto para la imagen */}
        <div className="w-full h-64 bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden flex-shrink-0">
          <img 
            src={imagenSegura} 
            alt={product.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Pequeño degradado oscuro abajo de la imagen para dar profundidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        {/* Contenedor de la información */}
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-2 tracking-tight">
            {product.title}
          </h3>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-6">
            ${product.price?.toLocaleString('es-CO')}
          </span>
          
          {/* Botón premium de ancho completo anclado abajo */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-auto w-full bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-200 px-4 py-3 rounded-2xl font-bold hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white transition-colors duration-300 active:scale-[0.98]"
          >
            Ver Detalle
          </button>
        </div>
      </div>

      {/* --- EL MODAL PREMIUM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 p-4 backdrop-blur-md">
          <div className="bg-white dark:bg-[#111111] rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 max-w-4xl w-full flex flex-col md:flex-row overflow-hidden relative shadow-2xl animate-in fade-in zoom-in duration-300 ease-out">
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full p-2 z-10 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div className="md:w-1/2 bg-zinc-100 dark:bg-zinc-900 h-72 md:h-auto relative">
              <img src={imagenSegura} alt={product.title} className="w-full h-full object-cover" />
            </div>
            
            <div className="p-8 md:p-12 md:w-1/2 flex flex-col">
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">{product.title}</h2>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-6">${product.price?.toLocaleString('es-CO')}</p>
              <div className="prose text-zinc-600 dark:text-zinc-400 mb-8 flex-grow leading-relaxed"><p>{product.description}</p></div>
              
              <div className="flex gap-4 mt-auto">
                <button onClick={() => toggleFavorite(product)} className={`p-4 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${isFav ? 'border-red-200 bg-red-50 text-red-500 dark:border-red-900/50 dark:bg-red-900/20' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                  <svg className="w-7 h-7" fill={isFav ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </button>
                <button onClick={() => { addToCart(product); setIsModalOpen(false); }} className="flex-grow bg-indigo-600 text-white font-bold py-4 px-6 rounded-2xl hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  Añadir al Carrito
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}