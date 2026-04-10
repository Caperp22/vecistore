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
    <div className="animate-in fade-in duration-300">
      
      {/* FORMULARIO CLÁSICO HORIZONTAL */}
      <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
          {editingSubcategory ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
        </h2>
        
        <form onSubmit={editingSubcategory ? handleUpdate : handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-zinc-500 mb-1 block">Categoría Padre</label>
            <select 
              required 
              value={editingSubcategory ? editingSubcategory.category_id : newSubcategory.category_id}
              onChange={e => editingSubcategory ? setEditingSubcategory({...editingSubcategory, category_id: e.target.value}) : setNewSubcategory({...newSubcategory, category_id: e.target.value})}
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-indigo-500 text-sm"
            >
              <option value="">Selecciona...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-zinc-500 mb-1 block">Nombre</label>
            <input type="text" required value={editingSubcategory ? editingSubcategory.name : newSubcategory.name} onChange={e => editingSubcategory ? setEditingSubcategory({...editingSubcategory, name: e.target.value}) : setNewSubcategory({...newSubcategory, name: e.target.value})} className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-indigo-500 text-sm" />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-zinc-500 mb-1 block">Slug (URL)</label>
            <input type="text" required value={editingSubcategory ? editingSubcategory.slug : newSubcategory.slug} onChange={e => editingSubcategory ? setEditingSubcategory({...editingSubcategory, slug: e.target.value}) : setNewSubcategory({...newSubcategory, slug: e.target.value})} placeholder="ej: llaveros" className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-indigo-500 text-sm" />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all">
              {loading ? '...' : editingSubcategory ? 'Guardar' : 'Agregar'}
            </button>
            {editingSubcategory && (
              <button type="button" onClick={() => setEditingSubcategory(null)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-4 py-2 rounded-lg font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* LISTA CLÁSICA */}
      <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Categoría Padre</th>
              <th className="p-4">URL (Slug)</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
            {subcategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-zinc-400">No hay subcategorías registradas.</td>
              </tr>
            ) : (
              subcategories.map((subcat) => {
                const parentCat = categories.find(c => c.id === subcat.category_id);
                return (
                  <tr key={subcat.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
                    <td className="p-4 font-bold text-zinc-900 dark:text-white">{subcat.name}</td>
                    <td className="p-4">
                      {parentCat ? (
                        <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded text-xs font-bold">
                          {parentCat.name}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">Sin categoría</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-xs">{subcat.slug}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setEditingSubcategory(subcat)} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold mr-4 text-xs">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(subcat.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold text-xs">
                        Borrar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}