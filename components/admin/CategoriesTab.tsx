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

  // Imagen por defecto por si no han puesto el banner
  const defaultBg = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600';

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Icono/Emoji</label>
                <input 
                  type="text" 
                  value={editingCategory ? editingCategory.icon_emoji || '' : newCategory.icon_emoji}
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
                value={editingCategory ? editingCategory.banner_image_url || '' : newCategory.banner_image_url}
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
                  className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 p-3 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white dark:bg-[#111] rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all flex flex-col group">
              
              {/* HEADER / IMAGEN DE PORTADA */}
              <div className="h-32 w-full relative bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                <img 
                  src={cat.banner_image_url || defaultBg} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={cat.name} 
                />
                <div className="absolute inset-0 bg-black/20" /> {/* Oscurecedor para destacar el emoji */}
                
                {/* EMOJI FLOTANTE */}
                <div className="absolute -bottom-5 left-5 w-12 h-12 bg-white dark:bg-[#111] rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-zinc-200 dark:border-zinc-800">
                  {cat.icon_emoji || '✨'}
                </div>
              </div>

              {/* INFORMACIÓN Y BOTONES */}
              <div className="p-5 pt-8 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight truncate">{cat.name}</h3>
                <p className="text-xs font-mono text-zinc-500 mb-5 truncate">/{cat.slug}</p>
                
                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => setEditingCategory(cat)}
                    className="flex-1 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-zinc-200 dark:border-zinc-700/50"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="px-4 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-100 dark:border-red-900/20"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}