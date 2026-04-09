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
  const [icon, setIcon] = useState('✨');

  // 🔥 ESTADOS PARA EL DRAG AND DROP
  const [draggedItem, setDraggedItem] = useState<any | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // --- LÓGICA DE FORMULARIO ---
  const openNewModal = () => {
    setEditingSub(null);
    setName(''); setCategoryId(''); setIcon('✨');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: any) => {
    setEditingSub(sub);
    setName(sub.name);
    setCategoryId(sub.category_id.toString());
    setIcon(sub.icon || '✨');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

    try {
      if (editingSub) {
        const subData = { name, slug, category_id: parseInt(categoryId), icon: icon || '✨' };
        const { error } = await supabase.from('subcategories').update(subData).eq('id', editingSub.id);
        if (error) throw error;
        
        setSubcategories((prev: any[]) => prev.map(s => s.id === editingSub.id ? { ...s, ...subData } : s));
        toast.success('Subcategoría actualizada ✏️');
      } else {
        // 🔥 Si es nueva, buscamos el orden más alto de esa categoría y le sumamos 1 para ponerla al final
        const categorySubs = subcategories.filter(s => s.category_id === parseInt(categoryId));
        const maxOrder = categorySubs.length > 0 ? Math.max(...categorySubs.map(s => s.sort_order || 0)) : -1;
        
        const subData = { name, slug, category_id: parseInt(categoryId), icon: icon || '✨', sort_order: maxOrder + 1 };
        
        const { data, error } = await supabase.from('subcategories').insert([subData]).select();
        if (error) throw error;
        if (data) setSubcategories((prev: any[]) => [...prev, data[0]]);
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
    if (!confirm('¿Seguro que quieres borrar esta subcategoría?')) return;
    try {
      const { error } = await supabase.from('subcategories').delete().eq('id', id);
      if (error) throw error;
      setSubcategories((prev: any[]) => prev.filter(s => s.id !== id));
      toast.success('Subcategoría eliminada 🗑️');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // --- 🔥 LÓGICA DE DRAG AND DROP (ARRASTRAR Y SOLTAR) 🔥 ---
  const handleDragStart = (e: React.DragEvent, sub: any) => {
    setDraggedItem(sub);
    // Efecto visual al arrastrar
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necesario para permitir el "Drop"
  };

  const handleDrop = async (e: React.DragEvent, targetSub: any, catId: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetSub.id) return;
    if (draggedItem.category_id !== catId) {
      toast.error('Solo puedes reordenar dentro de la misma categoría principal.');
      return;
    }

    setIsSavingOrder(true);

    // 1. Obtener la lista actual de esa categoría ordenada
    const list = subcategories
      .filter(s => s.category_id === catId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    // 2. Encontrar índices
    const draggedIndex = list.findIndex(s => s.id === draggedItem.id);
    const targetIndex = list.findIndex(s => s.id === targetSub.id);

    // 3. Reordenar el arreglo
    const newList = [...list];
    newList.splice(draggedIndex, 1); // Quitamos el item arrastrado
    newList.splice(targetIndex, 0, draggedItem); // Lo insertamos en la nueva posición

    // 4. Asignar nuevos números de orden (0, 1, 2, 3...)
    const updatedItems = newList.map((item, index) => ({ ...item, sort_order: index }));

    // 5. Actualización Optimista (Reflejar en pantalla de inmediato para que se vea rápido)
    setSubcategories((prev: any[]) => {
      const otrasCategorias = prev.filter(s => s.category_id !== catId);
      return [...otrasCategorias, ...updatedItems];
    });

    // 6. Guardar los nuevos órdenes en la base de datos (silenciosamente)
    try {
      await Promise.all(updatedItems.map(item => 
        supabase.from('subcategories').update({ sort_order: item.sort_order }).eq('id', item.id)
      ));
      // toast.success('Orden guardado'); // Opcional: Lo oculto para que no sea molesto cada vez que mueves algo
    } catch (error) {
      toast.error('Hubo un error al guardar el orden en la base de datos.');
    } finally {
      setIsSavingOrder(false);
      setDraggedItem(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 relative">
      
      {/* Indicador de guardado global para el drag and drop */}
      {isSavingOrder && (
        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-md z-10">
          Guardando orden...
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Gestión de Subcategorías</h2>
          <p className="text-sm text-zinc-500 mt-1">Arrastra y suelta las tarjetas para cambiar su orden de aparición.</p>
        </div>
        <button onClick={openNewModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 text-sm">
          <span>📁</span> Nueva Subcategoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {categories.map(cat => {
          // Filtramos y ordenamos localmente para dibujar la lista de esta columna
          const catSubs = subcategories
            .filter(s => s.category_id === cat.id)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

          return (
            <div key={cat.id} className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                {cat.name}
              </h3>
              
              <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {catSubs.length === 0 ? (
                    <p className="p-4 text-xs text-zinc-400 italic text-center">Sin subcategorías</p>
                  ) : (
                    catSubs.map(sub => (
                      <div 
                        key={sub.id} 
                        draggable // 🔥 HACEMOS LA TARJETA ARRASTRABLE
                        onDragStart={(e) => handleDragStart(e, sub)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, sub, cat.id)}
                        className={`p-3 flex justify-between items-center group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors bg-white dark:bg-[#111]
                          ${draggedItem?.id === sub.id ? 'border-2 border-dashed border-indigo-500' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {/* Agarradera visual */}
                          <div className="text-zinc-300 dark:text-zinc-600 cursor-grab hover:text-zinc-500 active:cursor-grabbing px-1">
                            ⋮⋮
                          </div>
                          <span className="text-xl bg-zinc-100 dark:bg-zinc-800 w-8 h-8 rounded-lg flex items-center justify-center pointer-events-none select-none">{sub.icon || '✨'}</span>
                          <div>
                            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block leading-tight pointer-events-none select-none">{sub.name}</span>
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
          );
        })}
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
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Nombre</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Personajes Anime" className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm" required />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Icono</label>
                  <input type="text" value={icon} onChange={e => setIcon(e.target.value)} placeholder="✨" className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm text-center text-xl" required />
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