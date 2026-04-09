'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

// 🔥 1. RECIBIMOS LA NUEVA PROP "subcategories"
export default function InventoryTab({ products, setProducts, categories, subcategories }: { products: any[], setProducts: any, categories: any[], subcategories: any[] }) {
  const [inventoryCatFilter, setInventoryCatFilter] = useState('Todas');
  const [inventorySubcatFilter, setInventorySubcatFilter] = useState('Todas');
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState(''); 
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setTitle(''); setPrice(''); setCategoryId(''); setSubcategory(''); setDescription(''); setImageFile(null);
    setIsInventoryModalOpen(true);
  };

  const openEditProductModal = (producto: any) => {
    setEditingProduct(producto);
    setTitle(producto.title); 
    setPrice(producto.price.toString()); 
    setCategoryId(producto.category_id?.toString() || ''); 
    setSubcategory(producto.subcategory || ''); 
    setDescription(producto.description); 
    setImageFile(null); 
    setIsInventoryModalOpen(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts((prev: any[]) => prev.filter(p => p.id !== id));
      toast.success('Producto eliminado 🗑️');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct && !imageFile) return toast.error('Debes subir una imagen para el nuevo producto');
    if (!categoryId) return toast.error('Selecciona una categoría');
    if (!subcategory) return toast.error('Selecciona una subcategoría');
    
    setUploading(true);
    try {
      let finalImageUrl = editingProduct?.image_url || '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      const productData = {
        title,
        description,
        price: parseInt(price),
        category_id: parseInt(categoryId),
        subcategory, 
        image_url: finalImageUrl
      };

      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;
        
        const catName = categories.find(c => c.id === parseInt(categoryId))?.name;
        setProducts((prev: any[]) => prev.map(p => p.id === editingProduct.id ? { ...p, ...productData, categories: { name: catName } } : p));
        toast.success('Producto actualizado ✏️');
      } else {
        const { data, error } = await supabase.from('products').insert([productData]).select('*, categories(name)');
        if (error) throw error;
        if (data) setProducts((prev: any[]) => [data[0], ...prev]);
        toast.success('Producto publicado 🎉');
      }

      setIsInventoryModalOpen(false);
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setUploading(false); 
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = inventoryCatFilter === 'Todas' || p.categories?.name === inventoryCatFilter;
    const matchesSubcat = inventorySubcatFilter === 'Todas' || p.subcategory === inventorySubcatFilter;
    return matchesCat && matchesSubcat;
  });

  // 🔥 2. LÓGICA DINÁMICA: Obtenemos el ID de la categoría seleccionada en los filtros
  const selectedCatIdForFilter = categories.find(c => c.name === inventoryCatFilter)?.id;
  // Filtramos las subcategorías que pertenecen a esa categoría
  const subcategoriasDelFiltro = selectedCatIdForFilter 
    ? subcategories.filter(sub => sub.category_id === selectedCatIdForFilter) 
    : [];

  // 🔥 3. LÓGICA DINÁMICA (Para el Formulario)
  const availableSubcategoriesForm = categoryId 
    ? subcategories.filter(sub => sub.category_id.toString() === categoryId) 
    : [];

  return (
    <div className="animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Catálogo de Productos</h2>
          <p className="text-sm text-zinc-500 mt-1">Tienes {products.length} artículos publicados en tu tienda.</p>
        </div>
        <button 
          onClick={openNewProductModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 text-sm shrink-0"
        >
          <span>➕</span> Añadir Producto
        </button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white dark:bg-[#111] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 mb-6 shadow-sm">
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-2 block">Filtrar por Categoría</label>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => { setInventoryCatFilter('Todas'); setInventorySubcatFilter('Todas'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${inventoryCatFilter === 'Todas' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
            >Todas</button>
            {categories.map(c => (
              <button 
                key={c.id}
                onClick={() => { setInventoryCatFilter(c.name); setInventorySubcatFilter('Todas'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${inventoryCatFilter === c.name ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
              >{c.name}</button>
            ))}
          </div>
        </div>

        {/* 🔥 4. RENDERIZADO DINÁMICO DE LOS BOTONES DE FILTRO 🔥 */}
        {inventoryCatFilter !== 'Todas' && subcategoriasDelFiltro.length > 0 && (
          <div className="flex-1 border-t sm:border-t-0 sm:border-l border-zinc-200 dark:border-zinc-800 pt-4 sm:pt-0 sm:pl-4">
            <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-2 block">Subcategorías de {inventoryCatFilter}</label>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setInventorySubcatFilter('Todas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${inventorySubcatFilter === 'Todas' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'border-transparent bg-zinc-50 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >Todas</button>
              {subcategoriasDelFiltro.map((sub: any) => (
                <button 
                  key={sub.id}
                  onClick={() => setInventorySubcatFilter(sub.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${inventorySubcatFilter === sub.name ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'border-transparent bg-zinc-50 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >{sub.name}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#111] rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <span className="text-4xl opacity-50 mb-3 block">👻</span>
          <p className="text-zinc-500 text-sm font-medium">No se encontraron productos con estos filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all flex flex-col group">
              
              <div className="h-48 w-full bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden">
                <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                    {p.categories?.name || 'General'}
                  </span>
                  {p.subcategory && (
                    <span className="bg-indigo-500/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">
                      {p.subcategory}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-1" title={p.title}>{p.title}</h3>
                <p className="text-zinc-500 text-xs mt-1.5 line-clamp-2 flex-grow">{p.description}</p>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                  <span className="font-black text-lg text-indigo-600 dark:text-indigo-400">${p.price?.toLocaleString('es-CO')}</span>
                  
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => openEditProductModal(p)} 
                      className="p-1.5 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" 
                      title="Editar Producto"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(p.id)} 
                      className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" 
                      title="Eliminar Producto"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {isInventoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col relative animate-in zoom-in-95">
            
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800/80">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingProduct ? '✏️ Editar Producto' : '🚀 Añadir Nuevo Producto'}
              </h2>
              <button onClick={() => setIsInventoryModalOpen(false)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-full p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Nombre del producto" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 text-sm bg-zinc-50 dark:bg-[#0A0A0A] rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 transition-colors" required />
                  <input type="number" placeholder="Precio ($)" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 text-sm bg-zinc-50 dark:bg-[#0A0A0A] rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 transition-colors" required />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <select 
                   value={categoryId} 
                   onChange={e => {
                     setCategoryId(e.target.value);
                     setSubcategory(''); 
                   }} 
                   className="w-full p-3 text-sm bg-zinc-50 dark:bg-[#0A0A0A] rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 transition-colors text-zinc-700 dark:text-zinc-300" required
                 >
                    <option value="">Categoría Principal...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>

                 {/* 🔥 5. RENDERIZADO DINÁMICO DE SUBCATEGORÍAS EN EL FORMULARIO 🔥 */}
                 <select 
                   value={subcategory} 
                   onChange={e => setSubcategory(e.target.value)} 
                   disabled={!categoryId || availableSubcategoriesForm.length === 0}
                   className="w-full p-3 text-sm bg-zinc-50 dark:bg-[#0A0A0A] rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 transition-colors text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed" required
                 >
                    <option value="">Subcategoría...</option>
                    {availableSubcategoriesForm.map((sub: any) => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                 </select>
               </div>

               <textarea placeholder="Descripción detallada..." value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 text-sm bg-zinc-50 dark:bg-[#0A0A0A] rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 transition-colors resize-none" rows={3} required />
               
               <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center hover:bg-zinc-50 dark:hover:bg-[#0A0A0A] transition-colors relative">
                 <input 
                   type="file" 
                   onChange={e => setImageFile(e.target.files?.[0] || null)} 
                   required={!editingProduct} 
                   className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer" 
                 />
                 {editingProduct && !imageFile && (
                   <p className="text-[10px] text-zinc-400 mt-2">Deja en blanco para conservar la imagen actual.</p>
                 )}
               </div>

               <div className="pt-2">
                 <button type="submit" disabled={uploading} className="w-full bg-indigo-600 text-white p-3.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {uploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Guardando...
                    </>
                  ) : editingProduct ? 'Guardar Cambios' : 'Publicar Producto'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}