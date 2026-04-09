'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function CategoriesTab({ categories, setCategories }: { categories: any[], setCategories: any }) {
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const handleImageUpload = async (categoryId: number, file: File | null) => {
    if (!file) return;
    setUploadingId(categoryId);
    
    try {
      // 1. Subir la imagen al bucket 'categories'
      const fileExt = file.name.split('.').pop();
      const fileName = `cat_${categoryId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('categories').upload(fileName, file);
      if (uploadError) throw uploadError;

      // 2. Obtener la URL pública
      const { data: publicUrlData } = supabase.storage.from('categories').getPublicUrl(fileName);
      const newImageUrl = publicUrlData.publicUrl;

      // 3. Actualizar la base de datos
      const { error: dbError } = await supabase.from('categories').update({ image_url: newImageUrl }).eq('id', categoryId);
      if (dbError) throw dbError;

      // 4. Actualizar la vista en tiempo real
      setCategories((prev: any[]) => prev.map(c => c.id === categoryId ? { ...c, image_url: newImageUrl } : c));
      toast.success('Imagen actualizada correctamente 🖼️');
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Gestión de Categorías</h2>
        <p className="text-sm text-zinc-500 mt-1">Sube o actualiza las imágenes de portada para la página de inicio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col group">
            
            {/* Vista previa de la imagen actual */}
            <div className="h-48 w-full bg-zinc-100 dark:bg-zinc-900 relative">
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm font-medium">
                  Sin imagen
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent flex items-end p-4">
                <h3 className="font-black text-white text-lg tracking-wide">{cat.name}</h3>
              </div>
            </div>
            
            {/* Controles para cambiar la foto */}
            <div className="p-4">
              <label className="block w-full text-center bg-zinc-50 dark:bg-[#0A0A0A] hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-3 cursor-pointer transition-colors">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {uploadingId === cat.id ? 'Subiendo...' : '📸 Cambiar Imagen'}
                </span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  disabled={uploadingId === cat.id}
                  onChange={(e) => handleImageUpload(cat.id, e.target.files?.[0] || null)}
                />
              </label>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}