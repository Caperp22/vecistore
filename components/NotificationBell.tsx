'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link'; // 🔥 El superhéroe de la navegación nativa

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('veci_notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed);
      if (parsed.length > 0) setUnread(true);
    }

    let channel: any;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const myId = session.user.id;
      const isAdmin = session.user.email === 'caperp22@gmail.com';

      if (isAdmin) {
        channel = supabase
          .channel('admin-channel')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
             addNotification('🛒 ¡Nuevo pedido recibido!', '/admin/dashboard');
          })
          .subscribe();
      } else {
        channel = supabase
          .channel(`client-${myId}`)
          .on('postgres_changes', { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'orders',
              filter: `user_id=eq.${myId}` 
            }, (payload) => {
              const nuevoEstado = payload.new.status;
              toast.success(`Tu pedido ahora está: ${nuevoEstado}`); 
              addNotification(`📦 Tu pedido cambió a: ${nuevoEstado}`, '/perfil');
          })
          .subscribe();
      }
    };

    setupRealtime();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (channel) supabase.removeChannel(channel);
        setupRealtime();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (channel) supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const addNotification = (text: string, link: string) => {
    const newNotif = { 
      id: Date.now(), 
      text, 
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), 
      link 
    };

    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 10);
      localStorage.setItem('veci_notifications', JSON.stringify(updated));
      return updated;
    });

    setUnread(true); 

    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } catch(e) {}
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200]); 
  };

  // --- AHORA SOLO BORRA LA NOTIFICACIÓN, EL <Link> SE ENCARGA DEL VIAJE ---
  const marcarComoLeida = (idQueVamosABorrar: number) => {
    const notificacionesRestantes = notifications.filter(notif => notif.id !== idQueVamosABorrar);
    
    setNotifications(notificacionesRestantes);
    localStorage.setItem('veci_notifications', JSON.stringify(notificacionesRestantes));
    
    if (notificacionesRestantes.length === 0) setUnread(false);
    setIsOpen(false);
  };

  const limpiarTodas = () => {
    setNotifications([]);
    localStorage.removeItem('veci_notifications');
    setUnread(false);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 text-zinc-500 hover:text-indigo-600 transition-colors relative flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unread && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white dark:border-zinc-900 shadow-sm"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
          
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center">
            <h4 className="font-black text-[10px] uppercase tracking-widest text-zinc-500">Notificaciones</h4>
            {notifications.length > 0 && (
              <button 
                onClick={limpiarTodas}
                className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-wider bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg transition-colors"
              >
                Limpiar todas
              </button>
            )}
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <span className="text-3xl mb-3 opacity-50">📭</span>
                <p className="text-zinc-500 font-medium text-sm">Bandeja vacía</p>
              </div>
            ) : (
              notifications.map((n) => (
                // 🔥 AQUÍ ESTÁ EL TRUCO: Usamos Link para navegar y onClick solo para borrar
                n.link ? (
                  <Link 
                    key={n.id}
                    href={n.link}
                    onClick={() => marcarComoLeida(n.id)}
                    className="block w-full text-left p-5 border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group active:scale-95"
                  >
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {n.text}
                    </p>
                    <p className="text-[10px] font-black tracking-widest text-indigo-500 mt-2 uppercase flex items-center gap-1">
                      {n.time} <span>→ Toca para ir</span>
                    </p>
                  </Link>
                ) : (
                  <button 
                    key={n.id}
                    onClick={() => marcarComoLeida(n.id)}
                    className="block w-full text-left p-5 border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group active:scale-95"
                  >
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {n.text}
                    </p>
                    <p className="text-[10px] font-black tracking-widest text-zinc-400 mt-2 uppercase">
                      {n.time}
                    </p>
                  </button>
                )
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}