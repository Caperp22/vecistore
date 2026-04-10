'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function InventoryTab({ products, setProducts, categories, subcategories }: { products: any[], setProducts: any, categories: any[], subcategories: any[] }) {
  const [newProduct, setNewProduct] = useState({ title: '', description: '', price: '', category_id: '', subcategory_id: '', image_url: '' });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 🔥 FUNCIÓN PARA SUBIR LA IMAGEN DEL PRODUCTO
  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `prod-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `productos/${fileName}`; // Se guarda en la carpeta productos

      const { error: uploadError } = await supabase.storage.from('tienda-images').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('tienda-images').getPublicUrl(filePath);
      const newUrl = data.publicUrl;

      if (editingProduct) {
        setEditingProduct({ ...editingProduct, image_url: newUrl });
      } else {
        setNewProduct({ ...newProduct, image_url: newUrl });
      }
      toast.success('Foto del producto subida con éxito 📸');
    } catch (err: any) {
      toast.error('Error al subir la foto: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.category_id) return toast.error('Debes seleccionar una categoría');
    
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').insert([{
        ...newProduct,
        subcategory_id: newProduct.subcategory_id || null // Si no elige subcategoría, se manda null
      }]).select('*, categories(name)');

      if (error) throw error;
      if (data) {
        setProducts([data[0], ...products]);
        setNewProduct({ title: '', description: '', price: '', category_id: '', subcategory_id: '', image_url: '' });
        toast.success('Producto creado exitosamente');
      }
    } catch (err: any) { toast.error(err.message); } 
    finally { setLoading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').update({
        title: editingProduct.title,
        description: editingProduct.description,
        price: editingProduct.price,
        category_id: editingProduct.category_id,
        subcategory_id: editingProduct.subcategory_id || null,
        image_url: editingProduct.image_url
      }).eq('id', editingProduct.id).select('*, categories(name)');

      if (error) throw error;
      if (data) {
        setProducts(products.map(p => p.id === editingProduct.id ? data[0] : p));
        setEditingProduct(null);
        toast.success('Producto actualizado');
      }
    } catch (err: any) { toast.error(err.message); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
      toast.success('Producto eliminado');
    } catch (err: any) { toast.error(err.message); }
  };

  // Filtrar subcategorías según la categoría seleccionada
  const activeCategoryId = editingProduct ? editingProduct.category_id : newProduct.category_id;
  const filteredSubcategories = subcategories.filter(sub => sub.category_id == activeCategoryId);

  const currentImageUrl = editingProduct ? editingProduct.image_url : newProduct.image_url;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      
      {/* FORMULARIO DE PRODUCTO */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-[#111] p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-24">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            {editingProduct ? '📝 Editar Producto' : '✨ Nuevo Producto'}
          </h2>
          
          <form onSubmit={editingProduct ? handleUpdate : handleCreate} className="space-y-4">
            
            {/* Título y Precio */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Título</label>
                <input type="text" required value={editingProduct ? editingProduct.title : newProduct.title} onChange={e => editingProduct ? setEditingProduct({...editingProduct, title: e.target.value}) : setNewProduct({...newProduct, title: e.target.value})} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Precio ($)</label>
                <input type="number" required value={editingProduct ? editingProduct.price : newProduct.price} onChange={e => editingProduct ? setEditingProduct({...editingProduct, price: e.target.value}) : setNewProduct({...newProduct, price: e.target.value})} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm font-bold text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Descripción</label>
              <textarea required rows={3} value={editingProduct ? editingProduct.description : newProduct.description} onChange={e => editingProduct ? setEditingProduct({...editingProduct, description: e.target.value}) : setNewProduct({...newProduct, description: e.target.value})} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm resize-none" />
            </div>

            {/* Categorías y Subcategorías */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Categoría</label>
                <select required value={editingProduct ? editingProduct.category_id : newProduct.category_id} onChange={e => {
                  const val = e.target.value;
                  editingProduct ? setEditingProduct({...editingProduct, category_id: val, subcategory_id: ''}) : setNewProduct({...newProduct, category_id: val, subcategory_id: ''});
                }} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm appearance-none truncate">
                  <option value="">Seleccionar...</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Subcategoría</label>
                <select value={editingProduct ? editingProduct.subcategory_id : newProduct.subcategory_id} onChange={e => editingProduct ? setEditingProduct({...editingProduct, subcategory_id: e.target.value}) : setNewProduct({...newProduct, subcategory_id: e.target.value})} disabled={!activeCategoryId || filteredSubcategories.length === 0} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm appearance-none truncate disabled:opacity-50">
                  <option value="">(Opcional)</option>
                  {filteredSubcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </select>
              </div>
            </div>

            {/* 🔥 BOTÓN DE SUBIDA DE IMAGEN 🔥 */}
            <div className="pt-2">
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Foto Principal del Producto</label>
              
              {currentImageUrl && (
                <div className="h-32 w-full rounded-2xl overflow-hidden mb-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
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
                <div className={`w-full p-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border-2 border-dashed ${uploadingImage ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400 border-indigo-200 dark:border-indigo-800' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 text-zinc-600 dark:text-zinc-300'}`}>
                  {uploadingImage ? 'Subiendo Foto...' : '📥 Seleccionar Foto desde PC'}
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="pt-4 flex gap-2">
              <button type="submit" disabled={loading || uploadingImage} className="flex-grow bg-indigo-600 text-white p-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all">
                {loading ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Publicar Producto'}
              </button>
              {editingProduct && (
                <button type="button" onClick={() => setEditingProduct(null)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 p-3 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* LISTADO DE PRODUCTOS */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white px-2">Inventario Actual ({products.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {products.map((prod) => {
            const catInfo = categories.find(c => c.id === prod.category_id);
            const subInfo = subcategories.find(s => s.id === prod.subcategory_id);

            return (
              <div key={prod.id} className="bg-white dark:bg-[#111] rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col group hover:shadow-md hover:border-indigo-500/50 transition-all p-2">
                <div className="h-40 w-full relative bg-zinc-100 dark:bg-zinc-900 overflow-hidden rounded-3xl">
                  <img src={prod.image_url || 'https://images.unsplash.com/photo-1555661530-68c8e968abea?q=80&w=600'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={prod.title} />
                  
                  {/* Precio Flotante */}
                  <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-black/90 backdrop-blur-md text-indigo-600 dark:text-indigo-400 font-black px-3 py-1.5 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
                    ${prod.price?.toLocaleString('es-CO')}
                  </div>
                </div>
                
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex gap-2 mb-2">
                    {catInfo && <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded-md">{catInfo.name}</span>}
                    {subInfo && <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md">{subInfo.name}</span>}
                  </div>

                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-1 mb-1">{prod.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4">{prod.description}</p>
                  
                  <div className="flex gap-2 mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    <button onClick={() => setEditingProduct(prod)} className="flex-1 py-2 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 transition-colors">Editar</button>
                    <button onClick={() => handleDelete(prod.id)} className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/20 hover:bg-red-100 transition-colors">Borrar</button>
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