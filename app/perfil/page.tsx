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
  
  // 🔥 ESTADOS PARA EDICIÓN DE PERFIL
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
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` }, 
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
        // Sincronizar campos de edición si el usuario carga después
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

  // 🔥 FUNCIÓN PARA GUARDAR CAMBIOS EN EL PERFIL
  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setActualizando(true);

    const { error } = await supabase.auth.updateUser({
      data: { 
        full_name: nombre,
        phone: telefono,
        address: direccion 
      }
    });

    if (error) {
      toast.error('Error al actualizar: ' + error.message);
    } else {
      toast.success('¡Perfil actualizado con éxito! ✨');
      setIsEditModalOpen(false);
      // Recargar la página para ver los cambios reflejados
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
      
      {/* Cabecera del Perfil con botón de editar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-8 gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/20">👤</div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
              {user?.user_metadata?.full_name || 'Mi Perfil'}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">{user?.email}</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 md:flex-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 px-6 py-3 rounded-2xl font-bold hover:border-indigo-500 transition-all flex items-center justify-center gap-2"
          >
            <span>✏️</span> Editar Datos
          </button>
          <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="flex-1 md:flex-none bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-6 py-3 rounded-2xl font-bold hover:bg-red-100 transition-all"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Grid de información de contacto rápida */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/60">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">📞 Teléfono de contacto</p>
          <p className="font-bold text-zinc-800 dark:text-zinc-200">{user?.user_metadata?.phone || 'No registrado'}</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/60">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">🏠 Dirección de entrega</p>
          <p className="font-bold text-zinc-800 dark:text-zinc-200">{user?.user_metadata?.address || 'No registrada'}</p>
        </div>
      </div>

      <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-6 tracking-tight flex items-center gap-3">
        <span>📦</span> Historial de Pedidos
      </h2>

      {/* ... (Aquí va tu mapeo de pedidos que ya tenías) ... */}
      {/* (Mantén la lógica de pedidos que ya funcionaba) */}
      
      {/* 🔥 MODAL DE EDICIÓN DE PERFIL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative animate-in zoom-in-95">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80 flex justify-between items-center">
              <h2 className="text-xl font-bold">Editar mis datos</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
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
                {actualizando ? 'Guardando...' : 'Actualizar mi información'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}