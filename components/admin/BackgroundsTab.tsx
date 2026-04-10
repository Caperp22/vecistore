'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function BackgroundsTab() {
  const [backgrounds, setBackgrounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBgs = async () => {
      const { data } = await supabase.from('page_backgrounds').select('*').order('name');
      if (data) setBackgrounds(data);
      setLoading(false);
    };
    fetchBgs();
  }, []);

  const handleGuardar = async (route: string, newUrl: string) => {
    try {
      const { error } = await supabase.from('page_backgrounds').update({ image_url: newUrl }).eq('route', route);
      if (error) throw error;
      toast.success('Fondo actualizado correctamente 🖼️');
      setBackgrounds(prev => prev.map(bg => bg.route === route ? { ...bg, image_url: newUrl } : bg));
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    }
  };

  if (loading) return <div className="animate-pulse text-center py-10">Cargando fondos...</div>;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Fondos Globales de la Tienda</h2>
        <p className="text-sm text-zinc-500 mt-1">Configura las imágenes que aparecerán translúcidas detrás de cada página.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {backgrounds.map((bg) => (
          <div key={bg.route} className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-zinc-900 dark:text-white text-lg mb-1">{bg.name}</h3>
            <p className="text-xs font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 self-start px-2 py-1 rounded mb-4">Ruta: {bg.route}</p>
            
            <div className="h-32 w-full rounded-xl overflow-hidden mb-4 border border-zinc-200 dark:border-zinc-800 relative">
               <img src={bg.image_url} alt="Fondo" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-white/85 dark:bg-[#0A0A0A]/90 backdrop-blur-sm flex items-center justify-center">
                 <span className="font-bold text-zinc-900 dark:text-white drop-shadow-md">Así se verá el contenido</span>
               </div>
            </div>

            <input 
              type="text" 
              defaultValue={bg.image_url}
              onBlur={(e) => handleGuardar(bg.route, e.target.value)}
              placeholder="Pega el link de la imagen aquí y haz clic afuera para guardar"
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}