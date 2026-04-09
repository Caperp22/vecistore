'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function SubcategoriesTab({ 
  categories, 
  subcategories, 
  setSubcategories 
}: { 
  categories: any[], 
  subcategories: any[], 
  setSubcategories: any 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Campos del formulario
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [icon, setIcon] = useState('✨'); // 🔥 Nuevo
  const [sortOrder, setSortOrder] = useState('0'); // 🔥 Nuevo

  const openNewModal = () => {
    setEditingSub(null);
    setName(''); setCategoryId(''); setIcon('✨'); setSortOrder('0');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: any) => {
    setEditingSub(sub);
    setName(sub.name);
    setCategoryId(sub.category_id.toString());
    setIcon(sub.icon || '✨');
    setSortOrder(sub.sort_order?.toString() || '0');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

    const subData = {
      name,
      slug,
      category_id: parseInt(categoryId),
      icon: icon || '✨',
      sort_order: parseInt(sortOrder) || 0
    };

    try {
      if (editingSub) {
        const { error } = await supabase.from('subcategories').update(subData).eq('id', editingSub.id);
        if (error) throw error;
        // Actualizamos y reordenamos el estado localmente
        setSubcategories((prev: any[]) => {
          const updated = prev.map(s => s.id === editingSub.id ? { ...s, ...subData } : s);
          return updated.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        });
        toast.success('Subcategoría actualizada ✏️');
      } else {
        const { data, error } = await supabase.from('subcategories').insert([subData]).select();
        if (error) throw error;
        if (data) {
          setSubcategories((prev: any[]) => {
            const updated = [...prev, data[0]];
            return updated.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          });
        }
        toast.success('Nueva subcategoría creada 📁');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres borrar esta subcategoría? Los productos que la usen podrían quedar sin clasificación.')) return;
    try {
      const { error } = await supabase.from('subcategories').delete().eq('id', id);
      if (error) throw error;
      setSubcategories((prev: any[]) => prev.filter(s => s.id !== id));
      toast.success('Subcategoría eliminada 🗑️');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Gestión de Subcategorías</h2>
          <p className="text-sm text-zinc-500 mt-1">Organiza los estilos y tipos de productos dentro de tus categorías principales.</p>
        </div>
        <button onClick={openNewModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 text-sm">
          <span>📁</span> Nueva Subcategoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {categories.map(cat => (
          <div key={cat.id} className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              {cat.name}
            </h3>
            
            <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {subcategories.filter(s => s.category_id === cat.id).length === 0 ? (
                  <p className="p-4 text-xs text-zinc-400 italic text-center">Sin subcategorías</p>
                ) : (
                  subcategories.filter(s => s.category_id === cat.id).map(sub => (
                    <div key={sub.id} className="p-3 flex justify-between items-center group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl bg-zinc-100 dark:bg-zinc-800 w-8 h-8 rounded-lg flex items-center justify-center">{sub.icon || '✨'}</span>
                        <div>
                          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block leading-tight">{sub.name}</span>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Orden: {sub.sort_order || 0}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(sub)} className="p-1.5 text-zinc-400 hover:text-indigo-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col relative animate-in zoom-in-95">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingSub ? 'Editar' : 'Nueva'} Subcategoría</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Categoría Padre</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm" required>
                  <option value="">Seleccionar...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Nombre</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Personajes Anime" className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Icono (Emoji)</label>
                  <input type="text" value={icon} onChange={e => setIcon(e.target.value)} placeholder="✨" className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm text-center text-xl" required />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Orden (0 es primero)</label>
                  <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm text-center" required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all mt-2">
                {loading ? 'Guardando...' : 'Guardar Subcategoría'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}