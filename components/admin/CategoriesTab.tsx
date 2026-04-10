'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function CategoriesTab({ categories, setCategories }: { categories: any[], setCategories: any }) {
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', icon_emoji: '✨', banner_image_url: '' });
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 🔥 FUNCIÓN PARA SUBIR IMAGEN A SUPABASE STORAGE
  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `cat-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `categorias/${fileName}`; // Lo guardamos en una subcarpeta

      const { error: uploadError } = await supabase.storage.from('tienda-images').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('tienda-images').getPublicUrl(filePath);
      const newUrl = data.publicUrl;

      // Actualizamos el estado dependiendo de si estamos creando o editando
      if (editingCategory) {
        setEditingCategory({ ...editingCategory, banner_image_url: newUrl });
      } else {
        setNewCategory({ ...newCategory, banner_image_url: newUrl });
      }
      toast.success('Imagen subida con éxito 📸');
    } catch (err: any) {
      toast.error('Error al subir imagen: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('categories').insert([newCategory]).select();
      if (error) throw error;
      if (data) {
        setCategories([...categories, data[0]]);
        setNewCategory({ name: '', slug: '', icon_emoji: '✨', banner_image_url: '' });
        toast.success('Categoría creada con éxito');
      }
    } catch (err: any) { toast.error(err.message); } 
    finally { setLoading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('categories').update({
        name: editingCategory.name, slug: editingCategory.slug,
        icon_emoji: editingCategory.icon_emoji, banner_image_url: editingCategory.banner_image_url
      }).eq('id', editingCategory.id);
      if (error) throw error;
      setCategories(categories.map(c => c.id === editingCategory.id ? editingCategory : c));
      setEditingCategory(null);
      toast.success('Categoría actualizada');
    } catch (err: any) { toast.error(err.message); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro?')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Categoría eliminada');
    } catch (err: any) { toast.error(err.message); }
  };

  const defaultBg = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600';
  const currentImageUrl = editingCategory ? editingCategory.banner_image_url : newCategory.banner_image_url;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      
      {/* FORMULARIO */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-[#111] p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-24">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            {editingCategory ? '📝 Editar Categoría' : '✨ Nueva Categoría'}
          </h2>
          
          <form onSubmit={editingCategory ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Nombre</label>
              <input type="text" required value={editingCategory ? editingCategory.name : newCategory.name} onChange={e => editingCategory ? setEditingCategory({...editingCategory, name: e.target.value}) : setNewCategory({...newCategory, name: e.target.value})} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm" />
            </div>
            
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Slug (URL)</label>
              <input type="text" required value={editingCategory ? editingCategory.slug : newCategory.slug} onChange={e => editingCategory ? setEditingCategory({...editingCategory, slug: e.target.value}) : setNewCategory({...newCategory, slug: e.target.value})} placeholder="ej: amigurumis" className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Icono/Emoji</label>
                <input type="text" value={editingCategory ? editingCategory.icon_emoji || '' : newCategory.icon_emoji} onChange={e => editingCategory ? setEditingCategory({...editingCategory, icon_emoji: e.target.value}) : setNewCategory({...newCategory, icon_emoji: e.target.value})} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm text-center" />
              </div>
              <div className="flex items-end">
                <div className="w-full h-[46px] bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                  {editingCategory ? editingCategory.icon_emoji : newCategory.icon_emoji}
                </div>
              </div>
            </div>

            {/* 🔥 BOTÓN DE SUBIDA DE IMAGEN 🔥 */}
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Fondo de Categoría</label>
              
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
                {loading ? 'Procesando...' : editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
              </button>
              {editingCategory && (
                <button type="button" onClick={() => setEditingCategory(null)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 p-3 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* LISTADO DE CATEGORÍAS */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white px-2">Categorías Existentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white dark:bg-[#111] rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col group">
              <div className="h-32 w-full relative bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                <img src={cat.banner_image_url || defaultBg} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cat.name} />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute -bottom-5 left-5 w-12 h-12 bg-white dark:bg-[#111] rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-zinc-200 dark:border-zinc-800">
                  {cat.icon_emoji || '✨'}
                </div>
              </div>
              <div className="p-5 pt-8 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white truncate">{cat.name}</h3>
                <p className="text-xs font-mono text-zinc-500 mb-5 truncate">/{cat.slug}</p>
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => setEditingCategory(cat)} className="flex-1 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700/50">Editar</button>
                  <button onClick={() => handleDelete(cat.id)} className="px-4 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/20">Borrar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}