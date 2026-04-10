'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function BackgroundsTab() {
  const [backgrounds, setBackgrounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingBg, setUploadingBg] = useState<string | null>(null);

  useEffect(() => {
    const fetchBgs = async () => {
      const { data } = await supabase.from('page_backgrounds').select('*').order('name');
      if (data) setBackgrounds(data);
      setLoading(false);
    };
    fetchBgs();
  }, []);

  const handleFileUpload = async (route: string, file: File) => {
    try {
      setUploadingBg(route);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `fondos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tienda-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('tienda-images')
        .getPublicUrl(filePath);

      const newUrl = publicUrlData.publicUrl;

      const { error: dbError } = await supabase.from('page_backgrounds').update({ image_url: newUrl }).eq('route', route);
      if (dbError) throw dbError;

      toast.success('¡Imagen subida y guardada! 🖼️');
      setBackgrounds(prev => prev.map(bg => bg.route === route ? { ...bg, image_url: newUrl } : bg));

    } catch (err: any) {
      toast.error('Error al subir: ' + err.message);
    } finally {
      setUploadingBg(null);
    }
  };

  const handleGuardarUrlManual = async (route: string, newUrl: string) => {
    try {
      const { error } = await supabase.from('page_backgrounds').update({ image_url: newUrl }).eq('route', route);
      if (error) throw error;
      toast.success('URL actualizada');
      setBackgrounds(prev => prev.map(bg => bg.route === route ? { ...bg, image_url: newUrl } : bg));
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    }
  };

  if (loading) return <div className="animate-pulse text-center py-10">Cargando fondos...</div>;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Fondos Globales</h2>
        <p className="text-xs text-zinc-500 mt-1">Sube imágenes directamente desde tu PC para decorar las páginas.</p>
      </div>

      {/* 🔥 GRID COMPACTO: 1 col móvil, 2 tablet, 3 PC normal, 4 monitores grandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {backgrounds.map((bg) => (
          <div key={bg.route} className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] p-4 shadow-sm flex flex-col group hover:border-indigo-500/50 transition-colors">
            
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-1">{bg.name}</h3>
              <span className="text-[9px] font-black tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md truncate max-w-[80px]">
                {bg.route}
              </span>
            </div>
            
            {/* 🔥 VISTA PREVIA MÁS DELGADA Y PANORÁMICA */}
            <div className="h-24 w-full rounded-xl overflow-hidden mb-3 border border-zinc-200 dark:border-zinc-800 relative">
               <img src={bg.image_url} alt="Fondo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
               <div className="absolute inset-0 bg-white/60 dark:bg-[#0A0A0A]/70 backdrop-blur-[3px] flex flex-col items-center justify-center">
                 <span className="font-bold text-zinc-900 dark:text-white drop-shadow-md text-xs">Área de Contenido</span>
               </div>
            </div>

            <div className="space-y-3 mt-auto">
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(bg.route, e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={uploadingBg === bg.route}
                />
                <div className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 font-bold text-[11px] transition-all border border-dashed ${uploadingBg === bg.route ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400 border-indigo-200 dark:border-indigo-800 cursor-not-allowed' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-zinc-600 dark:text-zinc-300'}`}>
                  {uploadingBg === bg.route ? (
                    <> <span className="animate-spin w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full"></span> Subiendo... </>
                  ) : (
                    <> <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg> Subir Imagen </>
                  )}
                </div>
              </div>

              <input 
                type="text" 
                defaultValue={bg.image_url}
                onBlur={(e) => {
                  if(e.target.value !== bg.image_url) handleGuardarUrlManual(bg.route, e.target.value)
                }}
                placeholder="Pega un link aquí..."
                className="w-full p-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-indigo-500 text-[10px] text-zinc-500"
              />
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}