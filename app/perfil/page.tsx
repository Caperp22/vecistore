'use client';

import { useEffect, useState } from 'react';
import { useAppContext } from '../../components/Providers';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function PerfilPage() {
  const { user } = useAppContext();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    const traerPedidos = async (userId: string) => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data && isMounted) setPedidos(data);
      if (isMounted) setLoading(false);

      if (!channel) {
        channel = supabase.channel(`realtime-pedidos-${userId}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` }, 
          async () => {
            toast.success('📦 ¡Actualización de tu pedido!');
            const { data: newData } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            if (newData && isMounted) setPedidos(newData);
          }).subscribe();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && isMounted) traerPedidos(session.user.id);
    });

    const revisarConPaciencia = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        traerPedidos(session.user.id);
      } else {
        setTimeout(async () => {
          if (!isMounted) return;
          const { data: { session: recheck } } = await supabase.auth.getSession();
          if (!recheck?.user) router.push('/login');
        }, 1000); 
      }
    };

    revisarConPaciencia();
    return () => { isMounted = false; subscription.unsubscribe(); if (channel) supabase.removeChannel(channel); };
  }, [router]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-500">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-6"></div>
      <p className="text-zinc-500 dark:text-zinc-400 font-bold text-xl animate-pulse">Cargando tu perfil...</p>
    </div>
  );

  return (
    <div className="py-10 max-w-5xl mx-auto px-4 animate-in fade-in duration-700">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-6 gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Mis Pedidos</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium flex items-center gap-2">
            <span>👋</span> Hola, {user?.user_metadata?.full_name || user?.email}
          </p>
        </div>
        <button 
          onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
          className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 px-5 py-3 rounded-2xl font-bold transition-all active:scale-95 text-sm"
        >
          Cerrar Sesión
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-[#111111] rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-5xl mb-6 block opacity-50">🛍️</span>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium mb-8">Aún no has realizado ningún pedido.</p>
          <Link href="/" className="inline-block bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 px-8 rounded-2xl hover:scale-105 transition-transform duration-300 shadow-lg">
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-white dark:bg-[#111111] p-6 sm:p-8 rounded-4xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-lg hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10 transition-all duration-300">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-100 dark:border-zinc-800/60 pb-5 mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">
                    Pedido del {new Date(pedido.created_at).toLocaleDateString('es-CO')}
                  </h3>
                </div>
                
                <div className="flex flex-col items-start sm:items-end">
                  <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest inline-block w-max border transition-colors duration-500
                    ${pedido.status === 'Pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' : 
                      pedido.status === 'En preparación' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 
                      pedido.status === 'Enviado' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' : 
                      'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'}`}
                  >
                    {pedido.status}
                  </span>
                  {pedido.status !== 'Pendiente' && pedido.updated_at && (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 font-bold uppercase tracking-wider animate-in fade-in">
                      Actualizado: {new Date(pedido.updated_at).toLocaleDateString('es-CO')}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800/60 mb-6">
                <ul className="space-y-4">
                  {pedido.items.map((item: any, i: number) => (
                    <li key={i} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-4">
                        <span className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl font-bold text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                          {item.cantidad}x
                        </span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300 text-base">{item.title}</span>
                      </div>
                      <span className="font-bold text-zinc-500 dark:text-zinc-400">
                        ${(item.price * (item.cantidad || 1)).toLocaleString('es-CO')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {pedido.observations && (
                <div className="bg-indigo-50/50 dark:bg-indigo-500/5 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 mb-6">
                  <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">Notas Especiales</p>
                  <p className="text-sm text-indigo-900 dark:text-indigo-200 italic font-medium">"{pedido.observations}"</p>
                </div>
              )}

              <div className="flex justify-between items-end pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest text-xs">Total del Pedido</span>
                <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  ${pedido.total.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}