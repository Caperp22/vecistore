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

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // 🔥 NUEVOS ESTADOS PARA EL INVENTARIO
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

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
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false })
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
    const ticketPromedio = pedidos.length > 0 ? Math.round(totalVentas / pedidos.length) : 0;
    
    const catMap: any = {};
    const prodMap: any = {};
    const clientMap: any = {}; 

    pedidos.forEach(p => {
      p.items.forEach((item: any) => {
        const catName = item.category_name || 'General'; 
        catMap[catName] = (catMap[catName] || 0) + (item.price * item.cantidad);
        prodMap[item.title] = (prodMap[item.title] || 0) + item.cantidad;
      });

      const clientName = p.customer_info?.name || 'Desconocido';
      clientMap[clientName] = (clientMap[clientName] || 0) + p.total;
    });

    const topProducts = Object.entries(prodMap).sort(([, a]: any, [, b]: any) => b - a).slice(0, 5);
    const topClientes = Object.entries(clientMap).sort(([, a]: any, [, b]: any) => b - a).slice(0, 5);

    const ultimos7Dias = Array.from({length: 7}).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i)); 
      const dateStr = d.toDateString();
      const dayName = d.toLocaleDateString('es-CO', { weekday: 'short' }).toUpperCase();
      
      const totalDia = pedidos
        .filter(p => new Date(p.created_at).toDateString() === dateStr)
        .reduce((acc, p) => acc + p.total, 0);
        
      return { nombre: dayName, total: totalDia };
    });

    const maxVentaDia = Math.max(...ultimos7Dias.map(d => d.total)) || 1;

    return { totalVentas, ventasHoy, ticketPromedio, catMap, topProducts, topClientes, ultimos7Dias, maxVentaDia };
  }, [pedidos]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
      if (error) throw error;
      setPedidos(prev => prev.map(p => p.id === orderId ? { ...p, status: newStatus, updated_at: new Date().toISOString() } : p));
      toast.success(`Pedido movido a ${newStatus}`);
    } catch (e: any) { toast.error(e.message); }
  };

  // 🔥 LÓGICA DE GESTIÓN DE INVENTARIO
  const openNewProductModal = () => {
    setEditingProduct(null);
    setTitle(''); setPrice(''); setCategoryId(''); setDescription(''); setImageFile(null);
    setIsInventoryModalOpen(true);
  };

  const openEditProductModal = (producto: any) => {
    setEditingProduct(producto);
    setTitle(producto.title); 
    setPrice(producto.price.toString()); 
    setCategoryId(producto.category_id?.toString() || ''); 
    setDescription(producto.description); 
    setImageFile(null); // No requerimos foto nueva al editar
    setIsInventoryModalOpen(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Producto eliminado 🗑️');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct && !imageFile) return toast.error('Debes subir una imagen para el nuevo producto');
    if (!categoryId) return toast.error('Selecciona una categoría');
    
    setUploading(true);
    try {
      let finalImageUrl = editingProduct?.image_url || '';

      // Si subió una foto nueva, la guardamos
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
        image_url: finalImageUrl
      };

      if (editingProduct) {
        // Actualizar
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;
        
        // Reflejar cambio en la vista sin recargar
        const catName = categories.find(c => c.id === parseInt(categoryId))?.name;
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productData, categories: { name: catName } } : p));
        toast.success('Producto actualizado ✏️');
      } else {
        // Insertar Nuevo
        const { data, error } = await supabase.from('products').insert([productData]).select('*, categories(name)');
        if (error) throw error;
        if (data) setProducts(prev => [data[0], ...prev]);
        toast.success('Producto publicado 🎉');
      }

      setIsInventoryModalOpen(false);
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setUploading(false); 
    }
  };

  if (loading) return <div className="py-32 text-center animate-pulse text-zinc-500 font-medium text-sm">Cargando Centro de Inteligencia...</div>;

  return (
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

      {/* --- MÓDULO 1: PEDIDOS --- */}
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
                <div key={pedido.id} className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-12 gap-6 hover:border-indigo-500/40 transition-colors shadow-sm items-center">
                  
                  <div className="lg:col-span-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-xl shrink-0">👤</div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight truncate">{pedido.customer_info?.name}</h4>
                      <p className="text-zinc-500 text-xs mt-0.5 truncate">{pedido.customer_info?.phone}</p>
                      <p className="text-zinc-400 text-[10px] mt-1 uppercase tracking-wider">{new Date(pedido.created_at).toLocaleDateString()} • {new Date(pedido.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-zinc-50 dark:bg-[#0A0A0A] p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 w-full">
                    <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-2 px-1">Artículos (Clic para ver detalle)</p>
                    <div className="space-y-1">
                      {pedido.items.map((item: any, i: number) => (
                        <button 
                          key={i} 
                          onClick={() => setSelectedProduct(item)}
                          className="w-full flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 p-2 hover:bg-white dark:hover:bg-zinc-800/80 rounded-lg transition-all group shadow-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px] shrink-0">{item.cantidad}x</span> 
                            <span className="line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-left" title={item.title}>{item.title}</span>
                          </div>
                          <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-3 flex lg:flex-col justify-between items-center lg:items-end gap-3 w-full">
                    <div className="text-left lg:text-right w-full lg:w-auto">
                      <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-0.5">Total</p>
                      <h5 className="text-xl font-black text-zinc-900 dark:text-white">${pedido.total.toLocaleString('es-CO')}</h5>
                    </div>
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
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ingresos Totales</p>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">${stats.totalVentas.toLocaleString('es-CO')}</h3>
              <span className="absolute top-4 right-4 text-3xl opacity-10 group-hover:opacity-20 transition-opacity rotate-12">💰</span>
            </div>
            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Pedidos Totales</p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{pedidos.length}</h3>
              <span className="absolute top-4 right-4 text-3xl opacity-10 group-hover:opacity-20 transition-opacity -rotate-12">📦</span>
            </div>
            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ventas Hoy</p>
              <h3 className="text-2xl font-black text-green-500">{stats.ventasHoy}</h3>
              <span className="absolute top-4 right-4 text-3xl opacity-10 group-hover:opacity-20 transition-opacity rotate-12">🔥</span>
            </div>
            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ticket Promedio</p>
              <h3 className="text-2xl font-black text-amber-500">${stats.ticketPromedio.toLocaleString('es-CO')}</h3>
              <span className="absolute top-4 right-4 text-3xl opacity-10 group-hover:opacity-20 transition-opacity -rotate-12">💳</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111] p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h4 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">📈 Rendimiento (Últimos 7 Días)</h4>
                <p className="text-xs text-zinc-500 mt-1">Evolución de ingresos en la última semana</p>
              </div>
            </div>
            
            <div className="h-48 w-full flex items-end justify-between gap-2 sm:gap-4 mt-4">
              {stats.ultimos7Dias.map((dia: any, idx: number) => {
                const alturaPorcentaje = (dia.total / stats.maxVentaDia) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center justify-end w-full h-full group relative">
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none z-10 whitespace-nowrap">
                      ${dia.total.toLocaleString('es-CO')}
                    </div>
                    <div 
                      className={`w-full max-w-[3rem] rounded-t-lg transition-all duration-1000 ${dia.total === stats.maxVentaDia ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-zinc-200 dark:bg-zinc-800 group-hover:bg-indigo-300 dark:group-hover:bg-indigo-900'}`}
                      style={{ height: `${Math.max(alturaPorcentaje, 5)}%` }} 
                    ></div>
                    <span className="text-[10px] font-bold text-zinc-500 mt-3">{dia.nombre}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-zinc-500">🛍️ Top Vendidos</h4>
              <div className="space-y-3">
                {stats.topProducts.map(([name, qty]: any, idx: number) => (
                  <div key={name} className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className={`font-black text-xs ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-zinc-400' : idx === 2 ? 'text-amber-700' : 'text-zinc-600 dark:text-zinc-500'}`}>#{idx + 1}</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">{name}</span>
                    </div>
                    <span className="text-zinc-900 dark:text-white font-bold shrink-0">{qty} und.</span>
                  </div>
                ))}
                {stats.topProducts.length === 0 && <p className="text-xs text-zinc-500 italic">No hay datos suficientes.</p>}
              </div>
            </div>

            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-zinc-500">📊 Por Categoría</h4>
              <div className="space-y-4 mt-2">
                {Object.entries(stats.catMap).map(([cat, val]: any) => (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-600 dark:text-zinc-400">{cat}</span>
                      <span className="text-zinc-900 dark:text-white">${val.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-1000 rounded-full" style={{ width: `${(val / stats.totalVentas) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
                {Object.keys(stats.catMap).length === 0 && <p className="text-xs text-zinc-500 italic">No hay datos suficientes.</p>}
              </div>
            </div>

            <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -z-10 blur-2xl"></div>
              <h4 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-zinc-500">👑 Clientes VIP</h4>
              <div className="space-y-3">
                {stats.topClientes.map(([name, val]: any, idx: number) => (
                  <div key={name} className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] shrink-0">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤'}
                      </div>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">{name}</span>
                    </div>
                    <span className="text-green-600 dark:text-green-400 font-bold shrink-0">${val.toLocaleString('es-CO')}</span>
                  </div>
                ))}
                {stats.topClientes.length === 0 && <p className="text-xs text-zinc-500 italic">No hay datos suficientes.</p>}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MÓDULO 3: GESTIÓN DE INVENTARIO (NUEVO CRUD) --- */}
      {activeTab === 'products' && (
        <div className="animate-in fade-in duration-300">
          
          {/* Cabecera del Inventario */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Catálogo de Productos</h2>
              <p className="text-sm text-zinc-500 mt-1">Tienes {products.length} artículos publicados en tu tienda.</p>
            </div>
            <button 
              onClick={openNewProductModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 text-sm"
            >
              <span>➕</span> Añadir Producto
            </button>
          </div>

          {/* Cuadrícula de Productos */}
          {products.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#111] rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="text-4xl opacity-50 mb-3 block">📦</span>
              <p className="text-zinc-500 text-sm font-medium">No tienes productos todavía. ¡Añade el primero!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all flex flex-col group">
                  
                  {/* Foto y Categoría */}
                  <div className="h-48 w-full bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden">
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {p.categories?.name || 'General'}
                    </div>
                  </div>
                  
                  {/* Info y Acciones */}
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
        </div>
      )}

      {/* 🔥 MODAL PARA AÑADIR / EDITAR PRODUCTO 🔥 */}
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
               <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-3 text-sm bg-zinc-50 dark:bg-[#0A0A0A] rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 transition-colors text-zinc-700 dark:text-zinc-300" required>
                  <option value="">Seleccionar Categoría...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
               <textarea placeholder="Descripción detallada..." value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 text-sm bg-zinc-50 dark:bg-[#0A0A0A] rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 transition-colors resize-none" rows={3} required />
               
               <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center hover:bg-zinc-50 dark:hover:bg-[#0A0A0A] transition-colors relative">
                 <input 
                   type="file" 
                   onChange={e => setImageFile(e.target.files?.[0] || null)} 
                   // Solo es obligatorio si estamos creando uno nuevo
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

      {/* 🔥 MODAL DE DETALLES DEL PEDIDO (El del Ojo) 🔥 */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative animate-in zoom-in-95">
            
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors z-10 backdrop-blur-md"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {(() => {
              const dbProduct = products.find(p => p.title === selectedProduct.title);
              const imageUrl = selectedProduct.image_url || dbProduct?.image_url || 'https://via.placeholder.com/400?text=Sin+Imagen';
              const description = dbProduct?.description || 'Sin descripción detallada guardada.';
              
              return (
                <>
                  <div className="h-64 w-full bg-zinc-100 dark:bg-zinc-900 relative">
                    <img src={imageUrl} alt={selectedProduct.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{selectedProduct.title}</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 leading-relaxed">{description}</p>
                    </div>
                    
                    <div className="flex justify-between items-center bg-zinc-50 dark:bg-[#0A0A0A] p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Precio Unitario</p>
                        <p className="font-bold text-zinc-900 dark:text-white">${selectedProduct.price?.toLocaleString('es-CO')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Cant. Solicitada</p>
                        <p className="font-black text-lg text-indigo-600 dark:text-indigo-400">{selectedProduct.cantidad} unid.</p>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}