'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function SubcategoriesTab({ categories, subcategories, setSubcategories }: { categories: any[], subcategories: any[], setSubcategories: any }) {
  const [newSubcategory, setNewSubcategory] = useState({ name: '', slug: '', category_id: '', icon_emoji: '✨', banner_image_url: '' });
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 🔥 FUNCIÓN PARA SUBIR IMAGEN A SUPABASE STORAGE
  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `subcat-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `subcategorias/${fileName}`; // Lo guardamos en una subcarpeta de subcategorías

      const { error: uploadError } = await supabase.storage.from('tienda-images').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('tienda-images').getPublicUrl(filePath);
      const newUrl = data.publicUrl;

      // Actualizamos el estado dependiendo de si estamos creando o editando
      if (editingSubcategory) {
        setEditingSubcategory({ ...editingSubcategory, banner_image_url: newUrl });
      } else {
        setNewSubcategory({ ...newSubcategory, banner_image_url: newUrl });
      }
      toast.success('Imagen de subcategoría subida con éxito 📸');
    } catch (err: any) {
      toast.error('Error al subir imagen: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcategory.category_id) {
      toast.error('Por favor selecciona una Categoría Padre');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('subcategories').insert([newSubcategory]).select();
      if (error) throw error;
      if (data) {
        setSubcategories([...subcategories, data[0]]);
        setNewSubcategory({ name: '', slug: '', category_id: '', icon_emoji: '✨', banner_image_url: '' });
        toast.success('Subcategoría creada con éxito');
      }
    } catch (err: any) { toast.error(err.message); } 
    finally { setLoading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('subcategories').update({
        name: editingSubcategory.name, 
        slug: editingSubcategory.slug,
        category_id: editingSubcategory.category_id,
        icon_emoji: editingSubcategory.icon_emoji, 
        banner_image_url: editingSubcategory.banner_image_url
      }).eq('id', editingSubcategory.id);
      
      if (error) throw error;
      
      setSubcategories(subcategories.map(s => s.id === editingSubcategory.id ? editingSubcategory : s));
      setEditingSubcategory(null);
      toast.success('Subcategoría actualizada');
    } catch (err: any) { toast.error(err.message); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de borrar esta subcategoría?')) return;
    try {
      const { error } = await supabase.from('subcategories').delete().eq('id', id);
      if (error) throw error;
      setSubcategories(subcategories.filter(s => s.id !== id));
      toast.success('Subcategoría eliminada');
    } catch (err: any) { toast.error(err.message); }
  };

  const defaultBg = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600';
  const currentImageUrl = editingSubcategory ? editingSubcategory.banner_image_url : newSubcategory.banner_image_url;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      
      {/* FORMULARIO */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-[#111] p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-24">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            {editingSubcategory ? '📝 Editar Subcategoría' : '✨ Nueva Subcategoría'}
          </h2>
          
          <form onSubmit={editingSubcategory ? handleUpdate : handleCreate} className="space-y-4">
            
            {/* SELECCIÓN DE CATEGORÍA PADRE */}
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Categoría Padre</label>
              <select 
                required 
                value={editingSubcategory ? editingSubcategory.category_id : newSubcategory.category_id}
                onChange={e => editingSubcategory ? setEditingSubcategory({...editingSubcategory, category_id: e.target.value}) : setNewSubcategory({...newSubcategory, category_id: e.target.value})}
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm appearance-none"
              >
                <option value="">Selecciona una categoría...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon_emoji} {cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Nombre</label>
              <input type="text" required value={editingSubcategory ? editingSubcategory.name : newSubcategory.name} onChange={e => editingSubcategory ? setEditingSubcategory({...editingSubcategory, name: e.target.value}) : setNewSubcategory({...newSubcategory, name: e.target.value})} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm" />
            </div>
            
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Slug (URL)</label>
              <input type="text" required value={editingSubcategory ? editingSubcategory.slug : newSubcategory.slug} onChange={e => editingSubcategory ? setEditingSubcategory({...editingSubcategory, slug: e.target.value}) : setNewSubcategory({...newSubcategory, slug: e.target.value})} placeholder="ej: llaveros-personalizados" className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Icono/Emoji</label>
                <input type="text" value={editingSubcategory ? editingSubcategory.icon_emoji || '' : newSubcategory.icon_emoji} onChange={e => editingSubcategory ? setEditingSubcategory({...editingSubcategory, icon_emoji: e.target.value}) : setNewSubcategory({...newSubcategory, icon_emoji: e.target.value})} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm text-center" />
              </div>
              <div className="flex items-end">
                <div className="w-full h-[46px] bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                  {editingSubcategory ? editingSubcategory.icon_emoji : newSubcategory.icon_emoji}
                </div>
              </div>
            </div>

            {/* 🔥 BOTÓN DE SUBIDA DE IMAGEN 🔥 */}
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Fondo de Subcategoría</label>
              
              {currentImageUrl && (
                <div className="h-24 w-full rounded-xl overflow-hidden mb-2 border border-zinc-200 dark:border-zinc-800">
                  <img src={currentImageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => { if (e.target.files && e.target.files.length > 0) handleImageUpload(e.target.files[0]); }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={uploadingImage}
                />
                <div className={`w-full p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all border-2 border-dashed ${uploadingImage ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400 border-indigo-200 dark:border-indigo-800' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 text-zinc-600 dark:text-zinc-300'}`}>
                  {uploadingImage ? 'Subiendo...' : '📥 Subir Imagen desde PC'}
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button type="submit" disabled={loading} className="flex-grow bg-indigo-600 text-white p-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all">
                {loading ? 'Procesando...' : editingSubcategory ? 'Guardar Cambios' : 'Crear Subcategoría'}
              </button>
              {editingSubcategory && (
                <button type="button" onClick={() => setEditingSubcategory(null)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 p-3 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* LISTADO DE SUBCATEGORÍAS */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white px-2">Subcategorías Existentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {subcategories.map((subcat) => {
            // Buscamos el nombre de la categoría padre
            const parentCat = categories.find(c => c.id === subcat.category_id);
            
            return (
              <div key={subcat.id} className="bg-white dark:bg-[#111] rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col group hover:shadow-md hover:border-indigo-500/50 transition-all">
                <div className="h-28 w-full relative bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                  <img src={subcat.banner_image_url || defaultBg} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={subcat.name} />
                  <div className="absolute inset-0 bg-black/20" />
                  
                  {/* Badge de la categoría padre */}
                  {parentCat && (
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/80 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                      {parentCat.icon_emoji} {parentCat.name}
                    </div>
                  )}

                  <div className="absolute -bottom-5 left-4 w-12 h-12 bg-white dark:bg-[#111] rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 z-10">
                    {subcat.icon_emoji || '✨'}
                  </div>
                </div>
                
                <div className="p-4 pt-7 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white truncate">{subcat.name}</h3>
                  <p className="text-xs font-mono text-zinc-500 mb-4 truncate">/{subcat.slug}</p>
                  
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => setEditingSubcategory(subcat)} className="flex-1 py-2 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 transition-colors">Editar</button>
                    <button onClick={() => handleDelete(subcat.id)} className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/20 hover:bg-red-100 transition-colors">Borrar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}