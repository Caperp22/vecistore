'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import OrdersTab from '@/components/admin/OrdersTab';
import MetricsTab from '@/components/admin/MetricsTab';
import InventoryTab from '@/components/admin/InventoryTab';
import CategoriesTab from '@/components/admin/CategoriesTab';
import SubcategoriesTab from '@/components/admin/SubcategoriesTab';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); 

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]); 
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    // 1. Función para descargar todos los datos
    const fetchAdminData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== 'caperp22@gmail.com') {
        router.push('/');
        return;
      }

      const [catsRes, subcatsRes, ordersRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').order('id', { ascending: true }),
        supabase.from('subcategories').select('*').order('name', { ascending: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false })
      ]);

      if (catsRes.data) setCategories(catsRes.data);
      if (subcatsRes.data) setSubcategories(subcatsRes.data);
      if (ordersRes.data) setPedidos(ordersRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      
      setLoading(false);
    };

    // Carga inicial
    fetchAdminData();

    // 🔥 2. TRANSMISIÓN EN VIVO PARA EL ADMINISTRADOR 🔥
    const channel = supabase.channel('admin-realtime')
      // Escuchar NUEVOS PEDIDOS
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        // Mostramos la notificación obligatoria
        toast.success('¡Nuevo pedido recibido! 🛍️', {
          description: 'El panel y las métricas se han actualizado al instante.',
          duration: 6000,
        });
        // Recargamos los datos
        fetchAdminData();
      })
      // Escuchar actualizaciones de pedidos (ej. si el cliente lo cancela o cambia de estado)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        fetchAdminData();
      })
      // Escuchar cambios en inventario para que también se actualice solo
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => fetchAdminData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const updateOrderStatus = async (orderId: string, newStatus: string, customerPhone?: string, customerName?: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      // 🔥 ESTA ES LA LÍNEA CLAVE: Mueve la tarjeta al instante visualmente
      setPedidos(prev => prev.map(p => 
        p.id === orderId 
          ? { ...p, status: newStatus, updated_at: new Date().toISOString() } 
          : p
      ));

      toast.success(`Pedido movido a ${newStatus}`);

      // 🔥 DICCIONARIO DE MENSAJES PERSONALIZADOS (CON EMOJIS RESTAURADOS)
      const mensajes: Record<string, string> = {
        'En preparación': `¡Buenas noticias, ${customerName}! ✨ Tu pedido en *VeciStore* ya está en manos de nuestros creadores. Estamos cuidando cada detalle para que quede perfecto. 🧶🛠️`,
        'Enviado': `¡Atención ${customerName}! 🚀 Tu pedido ha salido de nuestro taller y va camino a tu dirección. ¡Prepárate para recibir algo increíble! 📦💨`,
        'Entregado': `¡Hola ${customerName}! 🌟 Según nuestros registros, ya tienes tu pedido contigo. ¡Esperamos que lo disfrutes muchísimo! No olvides etiquetarnos en redes sociales. 📸💖`,
      };

      // Si el estado tiene un mensaje definido, abrimos WhatsApp
      if (customerPhone && mensajes[newStatus]) {
        const url = `https://wa.me/${customerPhone}?text=${encodeURIComponent(mensajes[newStatus])}`;
        window.open(url, '_blank');
      }

    } catch (e: any) { 
      toast.error(e.message); 
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
        
        <div className="flex flex-wrap justify-center gap-2 bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'orders' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Pedidos</button>
          <button onClick={() => setActiveTab('metrics')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'metrics' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Métricas</button>
          <button onClick={() => setActiveTab('products')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'products' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Inventario</button>
          <button onClick={() => setActiveTab('subcategories')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'subcategories' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Subcategorías</button>
          <button onClick={() => setActiveTab('categories')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'categories' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Categorías</button>
        </div>
      </div>

      {activeTab === 'orders' && <OrdersTab pedidos={pedidos} products={products} updateOrderStatus={updateOrderStatus} />}
      {activeTab === 'metrics' && <MetricsTab pedidos={pedidos} />}
      {activeTab === 'products' && <InventoryTab products={products} setProducts={setProducts} categories={categories} subcategories={subcategories} />}
      {activeTab === 'categories' && <CategoriesTab categories={categories} setCategories={setCategories} />}
      {activeTab === 'subcategories' && <SubcategoriesTab categories={categories} subcategories={subcategories} setSubcategories={setSubcategories} />}

    </div>
  );
}