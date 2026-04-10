'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function GlobalBackground() {
  const pathname = usePathname();
  const [bgUrl, setBgUrl] = useState<string>('');

  useEffect(() => {
    const fetchBackground = async () => {
      // 1. Si es el administrador, no ponemos fondo para mantenerlo limpio para trabajar
      if (pathname.startsWith('/admin')) {
        setBgUrl('');
        return;
      }

      // 2. Si es una categoría, buscamos el banner de ESA categoría
      if (pathname.startsWith('/categoria/')) {
        const slug = pathname.split('/')[2];
        const { data } = await supabase.from('categories').select('banner_image_url').eq('slug', slug).single();
        if (data?.banner_image_url) {
          setBgUrl(data.banner_image_url);
          return;
        }
      }

      // 3. Si es una página normal (Inicio, Carrito, Perfil)
      const { data } = await supabase.from('page_backgrounds').select('image_url').eq('route', pathname).single();
      if (data?.image_url) {
        setBgUrl(data.image_url);
      } else {
        setBgUrl(''); // Fondo por defecto si no hay nada
      }
    };

    fetchBackground();
  }, [pathname]);

  if (!bgUrl) return null;

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none transition-opacity duration-1000 ease-in-out">
      {/* La imagen de fondo */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      {/* El efecto translúcido intenso para que se puedan leer los textos de la página */}
      <div className="absolute inset-0 bg-white/85 dark:bg-[#0A0A0A]/90 backdrop-blur-md" />
    </div>
  );
}