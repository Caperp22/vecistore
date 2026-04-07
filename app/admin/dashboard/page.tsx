'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('metrics'); // metrics, orders, products
  const [orderFilter, setOrderFilter] = useState('Pendiente'); // Pendiente, En preparación, Historial

  // Datos
  const [categories, setCategories] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Formulario Producto
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== 'caperp22@gmail.com') {
        router.push('/');
        return;
      }

      const [catsRes, ordersRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*, categories(name)')
      ]);

      if (catsRes.data) setCategories(catsRes.data);
      if (ordersRes.data) setPedidos(ordersRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      
      setLoading(false);
    };
    fetchAdminData();
  }, [router]);

  // --- LÓGICA DE MÉTRICAS (Calculadas en tiempo real) ---
  const stats = useMemo(() => {
    const totalVentas = pedidos.reduce((acc, p) => acc + p.total, 0);
    const ventasHoy = pedidos.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length;
    
    // Ventas por categoría
    const catMap: any = {};
    pedidos.forEach(p => {
      p.items.forEach((item: any) => {
        // Asumiendo que guardamos category_id en el item o lo buscamos
        const catName = item.category_name || 'General'; 
        catMap[catName] = (catMap[catName] || 0) + (item.price * item.cantidad);
      });
    });

    // Productos más vendidos
    const prodMap: any = {};
    pedidos.forEach(p => {
      p.items.forEach((item: any) => {
        prodMap[item.title] = (prodMap[item.title] || 0) + item.cantidad;
      });
    });
    const topProducts = Object.entries(prodMap)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5);

    return { totalVentas, ventasHoy, catMap, topProducts };
  }, [pedidos]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
      if (error) throw error;
      setPedidos(prev => prev.map(p => p.id === orderId ? { ...p, status: newStatus, updated_at: new Date().toISOString() } : p));
      toast.success(`Pedido movido a ${newStatus}`);
    } catch (e: any) { toast.error(e.message); }
  };

  if (loading) return <div className="py-32 text-center animate-pulse text-zinc-500 font-bold text-xl">Cargando Centro de Inteligencia...</div>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      
      {/* Header Estilo Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl border border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/20">🚀</div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter">Panel Maestro</h1>
            <p className="text-zinc-400 font-medium">Control de VeciStore v2.0</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setActiveTab('metrics')} className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'metrics' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>Métricas</button>
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>Pedidos</button>
          <button onClick={() => setActiveTab('products')} className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'products' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>Inventario</button>
        </div>
      </div>

      {/* --- MÓDULO 1: MÉTRICAS (DASHBOARD) --- */}
      {activeTab === 'metrics' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Tarjetas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#111111] p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">Ingresos Totales</p>
              <h3 className="text-4xl font-black text-indigo-600 dark:text-indigo-400">${stats.totalVentas.toLocaleString('es-CO')}</h3>
            </div>
            <div className="bg-white dark:bg-[#111111] p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">Pedidos Totales</p>
              <h3 className="text-4xl font-black text-zinc-900 dark:text-white">{pedidos.length}</h3>
            </div>
            <div className="bg-white dark:bg-[#111111] p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">Ventas Hoy</p>
              <h3 className="text-4xl font-black text-green-500">{stats.ventasHoy}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Ventas */}
            <div className="bg-white dark:bg-[#111111] p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xl font-black mb-6 flex items-center gap-2">🔥 Más Vendidos</h4>
              <div className="space-y-4">
                {stats.topProducts.map(([name, qty]: any) => (
                  <div key={name} className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{name}</span>
                    <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg font-black">{qty} unid.</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Categorías */}
            <div className="bg-white dark:bg-[#111111] p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xl font-black mb-6 flex items-center gap-2">📊 Por Categoría (Ingresos)</h4>
              <div className="space-y-4">
                {Object.entries(stats.catMap).map(([cat, val]: any) => (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-zinc-500">{cat}</span>
                      <span className="text-zinc-900 dark:text-white">${val.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${(val / stats.totalVentas) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MÓDULO 2: PEDIDOS ORGANIZADOS --- */}
        {activeTab === 'orders' && (
        <div className="animate-in fade-in duration-500">
            {/* Sub-filtros de Pedidos */}
            <div className="flex gap-2 mb-8 bg-zinc-100 dark:bg-zinc-900/50 p-1.5 rounded-2xl w-max border border-zinc-200 dark:border-zinc-800">
            {['Pendiente', 'En preparación', 'Historial'].map((f) => (
                <button 
                key={f}
                onClick={() => setOrderFilter(f)}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${orderFilter === f ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm border border-zinc-200 dark:border-zinc-700' : 'text-zinc-500'}`}
                >
                {f === 'Historial' ? '📦 Historial' : f}
                </button>
            ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
            {pedidos
                .filter(p => {
                if (orderFilter === 'Historial') return p.status === 'Enviado' || p.status === 'Entregado';
                return p.status === orderFilter;
                })
                .map(pedido => (
                <div key={pedido.id} className="bg-white dark:bg-[#111111] p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 flex flex-col lg:flex-row justify-between gap-8 hover:border-indigo-500/30 transition-colors">
                    <div className="space-y-4 flex-grow">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl bg-zinc-100 dark:bg-zinc-900 p-3 rounded-xl">👤</span>
                        <div>
                        <h4 className="font-black text-lg leading-tight text-zinc-900 dark:text-white">{pedido.customer_info?.name}</h4>
                        <p className="text-zinc-500 text-sm font-medium">{pedido.customer_info?.phone} • {new Date(pedido.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        {pedido.items.map((item: any, i: number) => (
                        <p key={i} className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-1 last:mb-0">
                            <span className="text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded mr-2">{item.cantidad}x</span> 
                            {item.title}
                        </p>
                        ))}
                    </div>
                    </div>

                    <div className="lg:w-72 flex flex-col justify-between items-end gap-6">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Total Pedido</p>
                        <h5 className="text-3xl font-black text-zinc-900 dark:text-white">${pedido.total.toLocaleString('es-CO')}</h5>
                    </div>

                    {/* SELECTOR INTELIGENTE */}
                    <div className="w-full">
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Gestionar Estado</p>
                        <select 
                        value={pedido.status} 
                        onChange={(e) => updateOrderStatus(pedido.id, e.target.value)}
                        className="w-full bg-zinc-900 dark:bg-black text-white p-4 rounded-2xl font-bold border-2 border-zinc-800 outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none shadow-inner"
                        >
                        {orderFilter === 'Historial' ? (
                            // Si estamos en HISTORIAL, solo mostramos estados finales
                            <>
                            <option value="Enviado">🟣 Enviado</option>
                            <option value="Entregado">🟢 Entregado</option>
                            </>
                        ) : (
                            // Si estamos en PENDIENTE o PREPARACIÓN, mostramos todo el flujo
                            <>
                            <option value="Pendiente">🟡 Pendiente</option>
                            <option value="En preparación">🔵 En preparación</option>
                            <option value="Enviado">🟣 Enviado</option>
                            <option value="Entregado">🟢 Entregado</option>
                            </>
                        )}
                        </select>
                    </div>
                    </div>
                </div>
                ))}
            </div>
        </div>
        )}

      {/* --- MÓDULO 3: INVENTARIO (Subida de Productos) --- */}
      {activeTab === 'products' && (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
          <div className="bg-white dark:bg-[#111111] p-10 rounded-[3rem] border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-3xl font-black mb-8">Nuevo Producto</h2>
            {/* (Aquí va el formulario de antes, que ya tenías muy bien estilizado) */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!imageFile || !categoryId) return toast.error('Falta imagen o categoría');
              setUploading(true);
              try {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                await supabase.storage.from('products').upload(fileName, imageFile);
                const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
                await supabase.from('products').insert([{ title, description, price: parseInt(price), category_id: parseInt(categoryId), image_url: publicUrlData.publicUrl }]);
                toast.success('Producto publicado 🎉');
                setTitle(''); setDescription(''); setPrice(''); setCategoryId(''); setImageFile(null);
              } catch (err: any) { toast.error(err.message); } finally { setUploading(false); }
            }} className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Nombre" value={title} onChange={e => setTitle(e.target.value)} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl outline-none border border-transparent focus:border-indigo-500" required />
                  <input type="number" placeholder="Precio" value={price} onChange={e => setPrice(e.target.value)} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl outline-none border border-transparent focus:border-indigo-500" required />
               </div>
               <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl outline-none border border-transparent focus:border-indigo-500" required>
                  <option value="">Seleccionar Categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
               <textarea placeholder="Descripción" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl outline-none border border-transparent focus:border-indigo-500" rows={3} required />
               <input type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" required />
               <button type="submit" disabled={uploading} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
                {uploading ? 'Subiendo...' : 'Publicar Producto'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}