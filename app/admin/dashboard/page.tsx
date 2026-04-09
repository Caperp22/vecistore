'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import OrdersTab from '@/components/admin/OrdersTab';
import MetricsTab from '@/components/admin/MetricsTab';
import InventoryTab from '@/components/admin/InventoryTab';
import CategoriesTab from '@/components/admin/CategoriesTab'; // 🔥 1. IMPORTAMOS EL NUEVO COMPONENTE

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); 

  const [categories, setCategories] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== 'caperp22@gmail.com') {
        router.push('/');
        return;
      }

      const [catsRes, ordersRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').order('id', { ascending: true }), // 🔥 2. Lo ordenamos para que no salten
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // ... (este código queda igual)
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
      if (error) throw error;
      setPedidos(prev => prev.map(p => p.id === orderId ? { ...p, status: newStatus, updated_at: new Date().toISOString() } : p));
      toast.success(`Pedido movido a ${newStatus}`);
    } catch (e: any) { toast.error(e.message); }
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
        {/* 🔥 3. AGREGAMOS EL BOTÓN DE CATEGORÍAS AL MENÚ 🔥 */}
        <div className="flex flex-wrap justify-center gap-2 bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'orders' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Pedidos</button>
          <button onClick={() => setActiveTab('metrics')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'metrics' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Métricas</button>
          <button onClick={() => setActiveTab('products')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'products' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Inventario</button>
          <button onClick={() => setActiveTab('categories')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'categories' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>Categorías</button>
        </div>
      </div>

      {activeTab === 'orders' && <OrdersTab pedidos={pedidos} products={products} updateOrderStatus={updateOrderStatus} />}
      {activeTab === 'metrics' && <MetricsTab pedidos={pedidos} />}
      {activeTab === 'products' && <InventoryTab products={products} setProducts={setProducts} categories={categories} />}
      
      {/* 🔥 4. RENDERIZAMOS EL NUEVO COMPONENTE 🔥 */}
      {activeTab === 'categories' && <CategoriesTab categories={categories} setCategories={setCategories} />}

    </div>
  );
}