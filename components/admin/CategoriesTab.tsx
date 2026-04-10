'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function CategoriesTab({ categories, setCategories }: { categories: any[], setCategories: any }) {
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', icon_emoji: '✨', banner_image_url: '' });
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Función para crear categoría
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([newCategory])
        .select();

      if (error) throw error;
      if (data) {
        setCategories([...categories, data[0]]);
        setNewCategory({ name: '', slug: '', icon_emoji: '✨', banner_image_url: '' });
        toast.success('Categoría creada con éxito');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar categoría
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: editingCategory.name,
          slug: editingCategory.slug,
          icon_emoji: editingCategory.icon_emoji,
          banner_image_url: editingCategory.banner_image_url
        })
        .eq('id', editingCategory.id);

      if (error) throw error;
      
      setCategories(categories.map(c => c.id === editingCategory.id ? editingCategory : c));
      setEditingCategory(null);
      toast.success('Categoría actualizada');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro? Esto podría afectar a los productos de esta categoría.')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Categoría eliminada');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      
      {/* FORMULARIO DE CREACIÓN / EDICIÓN */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-[#111] p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-24">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            {editingCategory ? '📝 Editar Categoría' : '✨ Nueva Categoría'}
          </h2>
          
          <form onSubmit={editingCategory ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Nombre</label>
              <input 
                type="text" 
                required 
                value={editingCategory ? editingCategory.name : newCategory.name}
                onChange={e => editingCategory ? setEditingCategory({...editingCategory, name: e.target.value}) : setNewCategory({...newCategory, name: e.target.value})}
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Slug (URL)</label>
              <input 
                type="text" 
                required 
                value={editingCategory ? editingCategory.slug : newCategory.slug}
                onChange={e => editingCategory ? setEditingCategory({...editingCategory, slug: e.target.value}) : setNewCategory({...newCategory, slug: e.target.value})}
                placeholder="ej: amigurumis-especiales"
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            {/* 🔥 CAMPOS NUEVOS PARA DISEÑO DE BANNER */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Icono/Emoji</label>
                <input 
                  type="text" 
                  value={editingCategory ? editingCategory.icon_emoji : newCategory.icon_emoji}
                  onChange={e => editingCategory ? setEditingCategory({...editingCategory, icon_emoji: e.target.value}) : setNewCategory({...newCategory, icon_emoji: e.target.value})}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm text-center"
                />
              </div>
              <div className="flex items-end">
                <div className="w-full h-[46px] bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                  {editingCategory ? editingCategory.icon_emoji : newCategory.icon_emoji}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">URL Imagen de Banner</label>
              <input 
                type="text" 
                value={editingCategory ? editingCategory.banner_image_url : newCategory.banner_image_url}
                onChange={e => editingCategory ? setEditingCategory({...editingCategory, banner_image_url: e.target.value}) : setNewCategory({...newCategory, banner_image_url: e.target.value})}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button 
                type="submit" 
                disabled={loading}
                className="flex-grow bg-indigo-600 text-white p-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {loading ? 'Procesando...' : editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
              </button>
              {editingCategory && (
                <button 
                  type="button" 
                  onClick={() => setEditingCategory(null)}
                  className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 p-3 rounded-xl font-bold text-sm transition-all"
                >
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="group bg-white dark:bg-[#111] p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 transition-all shadow-sm flex flex-col relative overflow-hidden">
              
              {/* Preview del Banner en miniatura */}
              <div className="absolute top-0 right-0 w-32 h-full opacity-10 dark:opacity-20 pointer-events-none">
                 <img src={cat.banner_image_url} className="w-full h-full object-cover grayscale" alt="" />
              </div>

              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-2xl border border-zinc-200 dark:border-zinc-800">
                  {cat.icon_emoji || '✨'}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white">{cat.name}</h3>
                  <p className="text-[10px] font-mono text-zinc-500">/{cat.slug}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-auto relative z-10">
                <button 
                  onClick={() => setEditingCategory(cat)}
                  className="flex-grow py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 transition-all border border-zinc-100 dark:border-zinc-800"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(cat.id)}
                  className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all border border-red-100 dark:border-red-900/20"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}