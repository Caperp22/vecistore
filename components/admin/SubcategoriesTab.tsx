'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
// Importamos los componentes de Drag and Drop
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export default function SubcategoriesTab({ categories, subcategories, setSubcategories }: { categories: any[], subcategories: any[], setSubcategories: any }) {
  const [newSubcategory, setNewSubcategory] = useState({ name: '', slug: '', category_id: '' });
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcategory.category_id) return toast.error('Por favor selecciona una Categoría Padre');
    
    // Asignamos un sort_order inicial basado en la cantidad de subcategorías existentes en esa categoría
    const countInCat = subcategories.filter(s => s.category_id === newSubcategory.category_id).length;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.from('subcategories').insert([{...newSubcategory, sort_order: countInCat}]).select();
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

  // 🔥 Función para manejar el final del arrastre (Drop)
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    const categoryIdStr = result.source.droppableId; 
    
    // Convertimos el categoryId a número si es necesario, o lo mantenemos como string
    const categoryId = isNaN(Number(categoryIdStr)) ? categoryIdStr : Number(categoryIdStr);

    if (sourceIndex === destinationIndex) return;

    // Filtramos las subcategorías que pertenecen a esta categoría y las ordenamos por sort_order (o id si no hay sort_order)
    let categorySubs = subcategories
      .filter(sub => sub.category_id == categoryId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    // Reordenamos localmente
    const [reorderedItem] = categorySubs.splice(sourceIndex, 1);
    categorySubs.splice(destinationIndex, 0, reorderedItem);

    // Actualizamos el estado general (solo la parte visual primero para que sea rápido)
    const updatedSubcategories = subcategories.map(sub => {
      if (sub.category_id == categoryId) {
         const newIndex = categorySubs.findIndex(s => s.id === sub.id);
         return { ...sub, sort_order: newIndex };
      }
      return sub;
    });
    setSubcategories(updatedSubcategories);

    // Guardamos el nuevo orden en Supabase
    try {
      // Preparamos las actualizaciones masivas
      const updates = categorySubs.map((sub, index) => ({
        id: sub.id,
        sort_order: index,
        // Incluimos los campos requeridos por Supabase si tu tabla no permite nulls en updates
        name: sub.name,
        slug: sub.slug,
        category_id: sub.category_id
      }));

      const { error } = await supabase.from('subcategories').upsert(updates);
      if (error) throw error;
      
    } catch (error: any) {
      toast.error("Error al guardar el nuevo orden: " + error.message);
    }
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

      {/* LISTADO DE SUBCATEGORÍAS CON DRAG AND DROP */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white px-2">Subcategorías Existentes</h2>
        
        {/* Contexto de arrastre general */}
        <DragDropContext onDragEnd={onDragEnd}>
          {categories.map((category) => {
            // Filtramos y ordenamos por sort_order
            const categorySubs = subcategories
              .filter(sub => sub.category_id == category.id)
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            
            if (categorySubs.length === 0) return null;

            return (
              <div key={category.id} className="bg-white dark:bg-[#111] rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2 mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                  <span className="text-xl">{category.icon_emoji || '📁'}</span>
                  {category.name}
                  <span className="ml-auto text-xs font-normal text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">Arrastra para ordenar</span>
                </h3>
                
                {/* Zona donde se pueden soltar los elementos */}
                <Droppable droppableId={String(category.id)}>
                  {(provided) => (
                    <ul 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {categorySubs.map((subcat, index) => (
                        <Draggable key={String(subcat.id)} draggableId={String(subcat.id)} index={index}>
                          {(provided, snapshot) => (
                            <li 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                                snapshot.isDragging 
                                  ? 'bg-white dark:bg-zinc-800 border-indigo-500 shadow-xl scale-[1.02] z-50' 
                                  : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/80 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                {/* Manija para arrastrar */}
                                <div {...provided.dragHandleProps} className="text-zinc-400 hover:text-indigo-500 cursor-grab active:cursor-grabbing p-1">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"/></svg>
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-zinc-900 dark:text-white">{subcat.name}</p>
                                  <p className="text-xs font-mono text-zinc-500 mt-0.5">/{subcat.slug}</p>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <button onClick={() => setEditingSubcategory(subcat)} className="px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm hover:text-indigo-600 transition-colors">
                                  Editar
                                </button>
                                <button onClick={() => handleDelete(subcat.id)} className="px-4 py-2 bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                  Borrar
                                </button>
                              </div>
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </div>
            );
          })}
        </DragDropContext>

        {subcategories.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-[#111] rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
            <span className="text-4xl mb-4 block">📭</span>
            <p className="text-zinc-500 font-medium">Aún no hay subcategorías creadas.</p>
          </div>
        )}
      </div>
    </div>
  );
}