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

  // 🔥 FUNCIÓN PARA SUBIR ARCHIVOS A SUPABASE STORAGE
  const handleFileUpload = async (route: string, file: File) => {
    try {
      setUploadingBg(route);
      
      // 1. Creamos un nombre único para la imagen
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `fondos/${fileName}`;

      // 2. Subimos la imagen al bucket 'tienda-images'
      const { error: uploadError } = await supabase.storage
        .from('tienda-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Obtenemos la URL pública permanente
      const { data: publicUrlData } = supabase.storage
        .from('tienda-images')
        .getPublicUrl(filePath);

      const newUrl = publicUrlData.publicUrl;

      // 4. Guardamos la nueva URL en la tabla
      const { error: dbError } = await supabase.from('page_backgrounds').update({ image_url: newUrl }).eq('route', route);
      if (dbError) throw dbError;

      toast.success('¡Imagen subida y guardada correctamente! 🖼️');
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
      toast.success('URL actualizada correctamente');
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
        <p className="text-sm text-zinc-500 mt-1">Sube imágenes directamente desde tu PC. Quedarán guardadas permanentemente en tu servidor.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {backgrounds.map((bg) => (
          <div key={bg.route} className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-zinc-900 dark:text-white text-lg mb-1">{bg.name}</h3>
            <p className="text-[10px] font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 self-start px-2 py-1 rounded mb-4">Ruta: {bg.route}</p>
            
            <div className="h-40 w-full rounded-2xl overflow-hidden mb-5 border border-zinc-200 dark:border-zinc-800 relative group">
               <img src={bg.image_url} alt="Fondo" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-white/60 dark:bg-[#0A0A0A]/70 backdrop-blur-[4px] flex flex-col items-center justify-center">
                 <span className="font-bold text-zinc-900 dark:text-white drop-shadow-md text-lg">Área de Contenido</span>
                 <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">Así se verá la página</span>
               </div>
            </div>

            <div className="space-y-4 mt-auto">
              {/* 🔥 BOTÓN PARA SUBIR ARCHIVO */}
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
                <div className={`w-full p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border-2 border-dashed ${uploadingBg === bg.route ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400 border-indigo-200 dark:border-indigo-800 cursor-not-allowed' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-zinc-600 dark:text-zinc-300'}`}>
                  {uploadingBg === bg.route ? (
                    <> <span className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full"></span> Subiendo... </>
                  ) : (
                    <> <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg> Subir Imagen desde PC </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-grow"></div>
                <span className="text-xs text-zinc-400 font-medium">O pegar un Link</span>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-grow"></div>
              </div>

              <input 
                type="text" 
                defaultValue={bg.image_url}
                onBlur={(e) => {
                  if(e.target.value !== bg.image_url) handleGuardarUrlManual(bg.route, e.target.value)
                }}
                placeholder="https://..."
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-xs text-zinc-500"
              />
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}