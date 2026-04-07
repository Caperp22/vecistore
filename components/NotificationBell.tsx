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

      const userEmail = session.user.email;
      const isAdmin = userEmail === 'caperp22@gmail.com';

      // SUSCRIPCIÓN EN TIEMPO REAL
      const channel = supabase
        .channel('order-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            // Lógica para el ADMIN (Nuevo pedido)
            if (isAdmin && payload.eventType === 'INSERT') {
              addNotification('🛒 ¡Nuevo pedido recibido!');
            }
            
            // Lógica para el CLIENTE (Cambio de estado)
            if (!isAdmin && payload.eventType === 'UPDATE') {
              // Solo notificar si el pedido pertenece al usuario actual
              if (payload.new.customer_id === session.user.id) {
                addNotification(`📦 Tu pedido ahora está: ${payload.new.status}`);
              }
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    setupRealtime();
  }, []);

  const addNotification = (text: string) => {
    setNotifications(prev => [{ text, time: new Date().toLocaleTimeString() }, ...prev]);
    setUnread(true);
    // Opcional: Sonido de notificación
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {});
  };

  return (
    <div className="relative">
      <button 
        onClick={() => { setIsOpen(!isOpen); setUnread(false); }}
        className="p-2 text-zinc-500 hover:text-indigo-600 transition-colors relative"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread && (
          <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white dark:border-black rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
            <h4 className="font-black text-sm uppercase tracking-widest">Notificaciones</h4>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-zinc-500 text-sm">No hay novedades por ahora.</p>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className="p-4 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{n.text}</p>
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