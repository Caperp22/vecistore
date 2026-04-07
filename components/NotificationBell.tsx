'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    // 1. Cargar notificaciones del historial
    const saved = localStorage.getItem('veci_notifications');
    if (saved) setNotifications(JSON.parse(saved));

    let channel: any;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const myId = session.user.id;
      const isAdmin = session.user.email === 'caperp22@gmail.com';

      if (isAdmin) {
        // --- CANAL DEL ADMIN ---
        // Solo escucha cuando entra un pedido NUEVO (INSERT)
        channel = supabase
          .channel('admin-channel')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
             addNotification('🛒 ¡Nuevo pedido recibido!');
          })
          .subscribe();
          
      } else {
        // --- CANAL DEL CLIENTE (EL ARREGLO ESTÁ AQUÍ) ---
        // Usamos "filter" para que Supabase solo nos mande los cambios de ESTE usuario
        channel = supabase
          .channel(`client-${myId}`)
          .on('postgres_changes', { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'orders',
              filter: `user_id=eq.${myId}` // 🔥 Filtro mágico de seguridad
            }, (payload) => {
              
              // Como ya está filtrado desde el servidor, sabemos que 100% es para nosotros
              const nuevoEstado = payload.new.status;
              
              toast.success(`Tu pedido ahora está: ${nuevoEstado}`); // Chismoso visual
              addNotification(`📦 Tu pedido cambió a: ${nuevoEstado}`);
              
          })
          .subscribe();
      }
    };

    setupRealtime();

    // Reconexión para celulares
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

  const addNotification = (text: string) => {
    const newNotif = { text, time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), id: Date.now() };

    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 10);
      localStorage.setItem('veci_notifications', JSON.stringify(updated));
      return updated;
    });

    setUnread(true);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {});
  };

  return (
    <div className="relative">
      <button onClick={() => { setIsOpen(!isOpen); setUnread(false); }} className="p-2 text-zinc-500 hover:text-indigo-600 transition-colors relative">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white dark:border-black rounded-full scale-110 animate-pulse"></span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <h4 className="font-black text-[10px] uppercase tracking-widest text-zinc-500">Notificaciones</h4>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-zinc-500 text-sm">No hay novedades.</p>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className="p-4 border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <p className="text-sm font-bold">{n.text}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">{n.time}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}