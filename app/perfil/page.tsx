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

  // 🔥 ESTADOS PARA EDICIÓN DE PERFIL (Ocultos por defecto)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [nombre, setNombre] = useState(user?.user_metadata?.full_name || '');
  const [telefono, setTelefono] = useState(user?.user_metadata?.phone || '');
  const [direccion, setDireccion] = useState(user?.user_metadata?.address || '');
  const [actualizando, setActualizando] = useState(false);

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
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'orders', 
            filter: `user_id=eq.${userId}` 
          }, 
          async () => {
            toast.success('📦 ¡Actualización de tu pedido!');
            const { data: newData } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            if (newData && isMounted) setPedidos(newData);
          })
          .subscribe();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && isMounted) {
        traerPedidos(session.user.id);
        setNombre(session.user.user_metadata?.full_name || '');
        setTelefono(session.user.user_metadata?.phone || '');
        setDireccion(session.user.user_metadata?.address || '');
      }
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

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setActualizando(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: nombre, phone: telefono, address: direccion }
    });
    if (error) {
      toast.error('Error al actualizar: ' + error.message);
    } else {
      toast.success('¡Perfil actualizado! ✨');
      setIsEditModalOpen(false);
      router.refresh();
    }
    setActualizando(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-500">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-6"></div>
      <p className="text-zinc-500 dark:text-zinc-400 font-bold text-xl animate-pulse">Cargando tu perfil...</p>
    </div>
  );

  return (
    <div className="py-10 max-w-5xl mx-auto px-4 animate-in fade-in duration-700">
      
      {/* Cabecera del Perfil con Botón de Editar Estilo Icono */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-6 gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Mis Pedidos</h1>
            {/* 🔥 BOTÓN DE EDITAR PERFIL (Como pediste, sutil) */}
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors group"
              title="Editar mi perfil"
            >
              <svg className="w-5 h-5 text-zinc-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
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
              
              {/* Bloque Superior: Fecha y Estado */}
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

              {/* Lista de Productos estilo "Recibo" */}
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

      {/* 🔥 MODAL DE EDICIÓN DE PERFIL (Solo aparece al dar clic en el icono de engranaje) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative animate-in zoom-in-95">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80 flex justify-between items-center">
              <h2 className="text-xl font-bold">Mis Datos de Envío</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleGuardarPerfil} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Nombre Completo</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm" required />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Teléfono (WhatsApp)</label>
                <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Ej: 573001234567" className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm" required />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 mb-1 block px-1">Dirección de Envío</label>
                <textarea value={direccion} onChange={e => setDireccion(e.target.value)} rows={2} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-indigo-500 text-sm resize-none" required />
              </div>
              <button type="submit" disabled={actualizando} className="w-full bg-indigo-600 text-white p-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all mt-2">
                {actualizando ? 'Guardando...' : 'Actualizar Información'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}