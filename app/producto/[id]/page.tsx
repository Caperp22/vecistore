'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      // Buscamos el producto por su ID e incluimos el nombre de su categoría
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setProduct(data);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  // Función temporal para simular añadir al carrito
  const handleAddToCart = () => {
    // Aquí conectarás la lógica real de tu carrito (ej. Zustand, Context o Base de datos)
    toast.success(`Añadiste ${cantidad}x ${product.title} al carrito 🛒`);
  };

  if (loading) {
    return <div className="py-32 text-center animate-pulse text-zinc-500 font-bold">Cargando producto...</div>;
  }

  if (!product) {
    return (
      <div className="py-32 text-center flex flex-col items-center">
        <span className="text-6xl mb-4 opacity-50">🛸</span>
        <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white">Producto extraviado</h1>
        <p className="text-zinc-500 mb-6">Parece que este artículo ya no existe o fue eliminado.</p>
        <button onClick={() => router.back()} className="text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-6 py-2 rounded-xl hover:underline font-bold transition-all">
          Volver atrás
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Botón de Volver */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8 group"
      >
        <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver al catálogo
      </button>

      <div className="bg-white dark:bg-[#111] border border-zinc-200/80 dark:border-zinc-800/80 rounded-[2.5rem] p-6 md:p-10 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* COLUMNA IZQUIERDA: IMAGEN */}
          <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50">
            <img 
              src={product.image_url || 'https://via.placeholder.com/800?text=Sin+Imagen'} 
              alt={product.title} 
              className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
            {/* Etiquetas flotantes */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
              <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm">
                {product.categories?.name || 'General'}
              </span>
              {product.subcategory && (
                <span className="bg-indigo-500/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm">
                  {product.subcategory}
                </span>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: INFORMACIÓN */}
          <div className="flex flex-col h-full justify-center">
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4 leading-tight">
              {product.title}
            </h1>
            
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-6">
              ${product.price?.toLocaleString('es-CO')}
            </div>

            <div className="w-full h-px bg-zinc-100 dark:bg-zinc-800/80 mb-6"></div>

            <div className="mb-8">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Descripción del producto</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {product.description || 'Este producto no tiene una descripción detallada todavía.'}
              </p>
            </div>

            {/* CONTROLES DE COMPRA */}
            <div className="mt-auto space-y-4">
              <div className="flex gap-4">
                
                {/* Selector de Cantidad */}
                <div className="flex items-center bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1">
                  <button 
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-xl font-bold"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-black text-zinc-900 dark:text-white text-lg">
                    {cantidad}
                  </span>
                  <button 
                    onClick={() => setCantidad(cantidad + 1)}
                    className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-xl font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Botón Añadir al Carrito */}
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Añadir al carrito
                </button>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}