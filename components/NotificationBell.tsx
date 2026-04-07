'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const myId = session.user.id;
      const isAdmin = session.user.email === 'caperp22@gmail.com';

      console.log("🕵️ Notificaciones activas para:", isAdmin ? "ADMIN" : "CLIENTE", "ID:", myId);

      const channel = supabase
        .channel('order-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            console.log("📢 SEÑAL RECIBIDA:", payload);

            if (isAdmin && payload.eventType === 'INSERT') {
              addNotification('🛒 ¡Nuevo pedido recibido!');
            }
            
            if (payload.eventType === 'UPDATE') {
              // Verificamos quién es el dueño según la tabla
              const ownerId = payload.new.user_id;
              
              console.log("🤔 ¿Es para mí?", ownerId === myId, "| Dueño:", ownerId, "| Yo:", myId);

              if (ownerId === myId) {
                addNotification(`📦 Pedido actualizado a: ${payload.new.status}`);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log("📡 Estado de conexión Realtime:", status);
        });

      return () => { supabase.removeChannel(channel); };
    };

    setupRealtime();
  }, []);

  const addNotification = (text: string) => {
    setNotifications(prev => [{ text, time: new Date().toLocaleTimeString() }, ...prev]);
    setUnread(true);
    new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
  };

  return (
    <div className="relative">
      <button onClick={() => { setIsOpen(!isOpen); setUnread(false); }} className="p-2 text-zinc-500 hover:text-indigo-600 relative">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white dark:border-black rounded-full animate-pulse"></span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <h4 className="font-black text-[10px] uppercase tracking-widest text-zinc-500">Notificaciones</h4>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-zinc-500 text-sm">Sin novedades.</p>
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