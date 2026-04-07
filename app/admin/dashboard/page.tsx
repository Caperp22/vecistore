'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// --- COMPONENTE SELECTOR PREMIUM (Anti-Saltos de Línea) ---
const StatusSelector = ({ estadoActual, onCambiarEstado, isHistorial }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const todosLosEstados = [
    { nombre: 'Pendiente', color: 'bg-yellow-500', shadow: 'shadow-yellow-500/50', icon: '🟡' },
    { nombre: 'En preparación', color: 'bg-blue-500', shadow: 'shadow-blue-500/50', icon: '🔵' },
    { nombre: 'Enviado', color: 'bg-purple-500', shadow: 'shadow-purple-500/50', icon: '🟣' },
    { nombre: 'Entregado', color: 'bg-green-500', shadow: 'shadow-green-500/50', icon: '🟢' }
  ];

  const estadosPermitidos = isHistorial 
    ? todosLosEstados.filter(e => e.nombre === 'Enviado' || e.nombre === 'Entregado')
    : todosLosEstados;

  const estadoSeleccionado = todosLosEstados.find(e => e.nombre === estadoActual) || todosLosEstados[0];

  useEffect(() => {
    const handleClickFuera = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  return (
    <div className="relative w-full" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        // 🔥 whitespace-nowrap evita que el texto se rompa en dos líneas
        className="w-full flex justify-between items-center bg-white hover:bg-zinc-50 dark:bg-[#0A0A0A] dark:hover:bg-[#111] border border-zinc-200 hover:border-indigo-500 dark:border-zinc-800 dark:hover:border-indigo-500 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-white transition-all duration-200 shadow-sm whitespace-nowrap"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs shrink-0">{estadoSeleccionado.icon}</span>
          {estadoActual}
        </div>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ml-2 shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 w-full min-w-[160px] mt-1 bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {estadosPermitidos.map((estado) => (
            <button
              key={estado.nombre}
              onClick={() => {
                onCambiarEstado(estado.nombre);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800
                ${estadoActual === estado.nombre ? 'bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}
              `}
            >
              <span className="text-xs shrink-0">{estado.icon}</span>
              {estado.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
// -----------------------------------

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); 
  const [orderFilter, setOrderFilter] = useState('Pendiente'); 

  const [categories, setCategories] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

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

  const stats = useMemo(() => {
    const totalVentas = pedidos.reduce((acc, p) => acc + p.total, 0);
    const ventasHoy = pedidos.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length;
    
    const catMap: any = {};
    pedidos.forEach(p => {
      p.items.forEach((item: any) => {
        const catName = item.category_name || 'General'; 
        catMap[catName] = (catMap[catName] || 0) + (item.price * item.cantidad);
      });
    });

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

  if (loading) return <div className="py-32 text-center animate-pulse text-zinc-500 font-medium text-sm">Cargando Centro de Inteligencia...</div>;

  return (
    // 🔥 Expandimos el ancho al 100% de la ventana de layout principal
    <div className="w-full">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white dark:bg-[#111] p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-lg shadow-md shadow-indigo-500/20">🚀</div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Panel Maestro</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Control de VeciStore v2.0</p>
          </div>
        </div>
        <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'orders' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Pedidos</button>
          <button onClick={() => setActiveTab('metrics')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'metrics' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Métricas</button>
          <button onClick={() => setActiveTab('products')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'products' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Inventario</button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="animate-in fade-in duration-300">
          
          <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            {['Pendiente', 'En preparación', 'Enviado', 'Historial'].map((f) => {
              const cantidad = f === 'Historial' 
                ? pedidos.filter(p => p.status === 'Entregado').length
                : pedidos.filter(p => p.status === f).length;
              const isSelected = orderFilter === f;

              return (
                <button 
                  key={f}
                  onClick={() => setOrderFilter(f)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                    isSelected 
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' 
                      : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {f === 'Historial' ? '📦 Historial' : f}
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    isSelected 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                  }`}>
                    {cantidad}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4">
            {pedidos
              .filter(p => {
                if (orderFilter === 'Historial') return p.status === 'Entregado';
                return p.status === orderFilter;
              })
              .map(pedido => (
                // 🔥 Cambiado a sistema GRID de 12 columnas para aprovechar todo el ancho perfecto
                <div key={pedido.id} className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-12 gap-6 hover:border-indigo-500/40 transition-colors shadow-sm items-center">
                  
                  {/* Info Cliente - Toma 4 columnas */}
                  <div className="lg:col-span-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-xl shrink-0">👤</div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight truncate">{pedido.customer_info?.name}</h4>
                      <p className="text-zinc-500 text-xs mt-0.5 truncate">{pedido.customer_info?.phone}</p>
                      <p className="text-zinc-400 text-[10px] mt-1 uppercase tracking-wider">{new Date(pedido.created_at).toLocaleDateString()} • {new Date(pedido.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>

                  {/* Resumen de Productos - Toma 5 columnas */}
                  <div className="lg:col-span-5 bg-zinc-50 dark:bg-[#0A0A0A] p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/80 w-full">
                    <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-2">Artículos</p>
                    <div className="space-y-1.5">
                      {pedido.items.map((item: any, i: number) => (
                        <p key={i} className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-1.5 rounded text-[10px] shrink-0 mt-0.5">{item.cantidad}x</span> 
                          <span className="line-clamp-1" title={item.title}>{item.title}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Acciones y Total - Toma 3 columnas (Espacio más que suficiente para no partir el texto) */}
                  <div className="lg:col-span-3 flex lg:flex-col justify-between items-center lg:items-end gap-3 w-full">
                    <div className="text-left lg:text-right w-full lg:w-auto">
                      <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-0.5">Total</p>
                      <h5 className="text-xl font-black text-zinc-900 dark:text-white">${pedido.total.toLocaleString('es-CO')}</h5>
                    </div>
                    {/* Contenedor del selector un poco más ancho */}
                    <div className="w-48 sm:w-56 shrink-0">
                      <StatusSelector 
                        estadoActual={pedido.status} 
                        isHistorial={orderFilter === 'Historial'}
                        onCambiarEstado={(nuevoEstado: string) => updateOrderStatus(pedido.id, nuevoEstado)}
                      />
                    </div>
                  </div>

                </div>
              ))}
              
              {pedidos.filter(p => (orderFilter === 'Historial' ? p.status === 'Entregado' : p.status === orderFilter)).length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-[#111] rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <span className="text-3xl opacity-50 mb-2 block">📭</span>
                  <p className="text-zinc-500 text-sm font-medium">No hay pedidos en esta sección</p>
                </div>
              )}
          </div>
        </div>
      )}

      {/* --- MÓDULO 2: MÉTRICAS --- */}
      {activeTab === 'metrics' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ingresos Totales</p>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">${stats.totalVentas.toLocaleString('es-CO')}</h3>
            </div>
            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Pedidos Totales</p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{pedidos.length}</h3>
            </div>
            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ventas Hoy</p>
              <h3 className="text-2xl font-black text-green-500">{stats.ventasHoy}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-base font-bold mb-4 flex items-center gap-2">🔥 Top Vendidos</h4>
              <div className="space-y-2">
                {stats.topProducts.map(([name, qty]: any) => (
                  <div key={name} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-[#0A0A0A] rounded-xl text-sm border border-zinc-100 dark:border-zinc-800/50">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate pr-4">{name}</span>
                    <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded text-xs font-bold shrink-0">{qty} unid.</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-base font-bold mb-4 flex items-center gap-2">📊 Ingresos por Categoría</h4>
              <div className="space-y-4">
                {Object.entries(stats.catMap).map(([cat, val]: any) => (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-500">{cat}</span>
                      <span className="text-zinc-900 dark:text-white">${val.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-1000 rounded-full" style={{ width: `${(val / stats.totalVentas) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MÓDULO 3: INVENTARIO --- */}
      {activeTab === 'products' && (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#111] p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Añadir Nuevo Producto</h2>
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
            }} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Nombre del producto" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 text-sm bg-zinc-50 dark:bg-[#0A0A0A] rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors" required />
                  <input type="number" placeholder="Precio ($)" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 text-sm bg-zinc-50 dark:bg-[#0A0A0A] rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors" required />
               </div>
               <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-3 text-sm bg-zinc-50 dark:bg-[#0A0A0A] rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors text-zinc-700 dark:text-zinc-300" required>
                  <option value="">Seleccionar Categoría...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
               <textarea placeholder="Descripción detallada..." value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 text-sm bg-zinc-50 dark:bg-[#0A0A0A] rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors resize-none" rows={4} required />
               
               <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center hover:bg-zinc-50 dark:hover:bg-[#0A0A0A] transition-colors">
                 <input type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer" required />
               </div>

               <button type="submit" disabled={uploading} className="w-full bg-indigo-600 text-white p-3.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50 mt-2">
                {uploading ? 'Subiendo producto...' : 'Publicar Producto'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}