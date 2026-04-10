'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function SubcategoriesTab({ categories, subcategories, setSubcategories }: { categories: any[], subcategories: any[], setSubcategories: any }) {
  const [newSubcategory, setNewSubcategory] = useState({ name: '', slug: '', category_id: '' });
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
        setNewSubcategory({ name: '', slug: '', category_id: '' });
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
        category_id: editingSubcategory.category_id
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      
      {/* FORMULARIO SIMPLIFICADO */}
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
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
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

      {/* LISTADO DE SUBCATEGORÍAS LIMPIO */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white px-2">Subcategorías Existentes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subcategories.map((subcat) => {
            const parentCat = categories.find(c => c.id === subcat.category_id);
            
            return (
              <div key={subcat.id} className="bg-white dark:bg-[#111] rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex flex-col group hover:shadow-md hover:border-indigo-500/50 transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight">{subcat.name}</h3>
                    <p className="text-xs font-mono text-zinc-500 mt-1">/{subcat.slug}</p>
                  </div>
                  {parentCat && (
                    <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-500/20 text-right max-w-[100px] truncate">
                      {parentCat.name}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2 mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                  <button onClick={() => setEditingSubcategory(subcat)} className="flex-1 py-2 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 transition-colors">Editar</button>
                  <button onClick={() => handleDelete(subcat.id)} className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/20 hover:bg-red-100 transition-colors">Borrar</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}