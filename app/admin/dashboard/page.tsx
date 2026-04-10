'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase'; // Asegúrate de que esta ruta no te dé error, si te da, cámbiala a '@/lib/supabase'
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import OrdersTab from '@/components/admin/OrdersTab';
import MetricsTab from '@/components/admin/MetricsTab';
import InventoryTab from '@/components/admin/InventoryTab';
import CategoriesTab from '@/components/admin/CategoriesTab';
import SubcategoriesTab from '@/components/admin/SubcategoriesTab';
// 🔥 1. IMPORTACIÓN DE LA NUEVA PESTAÑA
import WhatsappTab from '@/components/admin/WhatsappTab'; 
import BackgroundsTab from '@/components/admin/BackgroundsTab';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); 

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]); 
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // 🔥 2. ESTADO PARA LOS MENSAJES DE WHATSAPP
  const [waTemplates, setWaTemplates] = useState<any[]>([]); 

  useEffect(() => {
    const fetchAdminData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== 'caperp22@gmail.com') {
        router.push('/');
        return;
      }

      // 🔥 3. DESCARGAMOS LAS PLANTILLAS DESDE SUPABASE
      const [catsRes, subcatsRes, ordersRes, prodRes, waRes] = await Promise.all([
        supabase.from('categories').select('*').order('id', { ascending: true }),
        supabase.from('subcategories').select('*').order('name', { ascending: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('whatsapp_templates').select('*') 
      ]);

      if (catsRes.data) setCategories(catsRes.data);
      if (subcatsRes.data) setSubcategories(subcatsRes.data);
      if (ordersRes.data) setPedidos(ordersRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      if (waRes.data) setWaTemplates(waRes.data);
      
      setLoading(false);
    };

    fetchAdminData();

    const channel = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        toast.success('¡Nuevo pedido recibido! 🛍️', {
          description: 'El panel y las métricas se han actualizado al instante.',
          duration: 6000,
        });
        fetchAdminData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => fetchAdminData())
      // 🔥 4. ESCUCHAR CAMBIOS EN LOS MENSAJES
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_templates' }, () => fetchAdminData())
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

      setPedidos(prev => prev.map(p => 
        p.id === orderId ? { ...p, status: newStatus, updated_at: new Date().toISOString() } : p
      ));

      toast.success(`Pedido movido a ${newStatus}`);

      // 🔥 5. USAMOS LAS PLANTILLAS DE LA BASE DE DATOS EN LUGAR DE CÓDIGO QUEMADO
      const templateRecord = waTemplates.find(t => t.status === newStatus);
      
      if (customerPhone && templateRecord) {
        // Cambiamos [CLIENTE] por el nombre real de la persona
        const mensajeFinal = templateRecord.message.replace(/\[CLIENTE\]/g, customerName || 'Cliente');
        const url = `https://wa.me/${customerPhone}?text=${encodeURIComponent(mensajeFinal)}`;
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
          {/* 🔥 6. EL NUEVO BOTÓN */}
          <button onClick={() => setActiveTab('whatsapp')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'whatsapp' ? 'bg-white dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30 shadow-sm' : 'text-zinc-500 hover:text-green-600 dark:hover:text-green-400'}`}>Mensajes WA</button>
          <button onClick={() => setActiveTab('backgrounds')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'backgrounds' ? 'bg-white dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 shadow-sm' : 'text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400'}`}>🎨 Fondos de Página</button>
        </div>
      </div>

      {activeTab === 'orders' && <OrdersTab pedidos={pedidos} products={products} updateOrderStatus={updateOrderStatus} />}
      {activeTab === 'metrics' && <MetricsTab pedidos={pedidos} />}
      {activeTab === 'products' && <InventoryTab products={products} setProducts={setProducts} categories={categories} subcategories={subcategories} />}
      {activeTab === 'categories' && <CategoriesTab categories={categories} setCategories={setCategories} />}
      {activeTab === 'subcategories' && <SubcategoriesTab categories={categories} subcategories={subcategories} setSubcategories={setSubcategories} />}
      {/* 🔥 7. EL COMPONENTE DE EDICIÓN */}
      {activeTab === 'whatsapp' && <WhatsappTab templates={waTemplates} setTemplates={setWaTemplates} />}
      {activeTab === 'backgrounds' && <BackgroundsTab />}

    </div>
  );
}