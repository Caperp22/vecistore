'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function GlobalBackground() {
  const pathname = usePathname();
  const [bgUrl, setBgUrl] = useState<string>('');

  useEffect(() => {
    const fetchBackground = async () => {
      if (pathname.startsWith('/admin')) {
        setBgUrl('');
        return;
      }

      // 🔥 Fondos para Categorías
      if (pathname.startsWith('/categoria/')) {
        const slug = pathname.split('/')[2];
        const { data } = await supabase.from('categories').select('banner_image_url').eq('slug', slug).single();
        if (data?.banner_image_url) {
          setBgUrl(data.banner_image_url);
          return;
        }
      }

      // 🔥 Fondos para Detalle de Producto
      if (pathname.startsWith('/producto/')) {
        const { data } = await supabase.from('page_backgrounds').select('image_url').eq('route', '/producto').single();
        if (data?.image_url) {
          setBgUrl(data.image_url);
          return;
        }
      }

      // 🔥 Fondos Globales (Inicio, Login, Carrito, etc)
      const { data } = await supabase.from('page_backgrounds').select('image_url').eq('route', pathname).single();
      if (data?.image_url) {
        setBgUrl(data.image_url);
      } else {
        setBgUrl(''); 
      }
    };

    fetchBackground();
  }, [pathname]);

  if (!bgUrl) return null;

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none transition-opacity duration-1000 ease-in-out">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      <div className="absolute inset-0 bg-white/60 dark:bg-[#0A0A0A]/70 backdrop-blur-[6px]" />
    </div>
  );
}