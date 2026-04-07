'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  
  // Usamos una referencia para saber siempre el ID del usuario sin depender de re-renders
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Cargar notificaciones guardadas
    const saved = localStorage.getItem('veci_notifications');
    if (saved) setNotifications(JSON.parse(saved));

    let channel: any;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      userIdRef.current = session.user.id;
      const isAdmin = session.user.email === 'caperp22@gmail.com';

      // 2. Conectar al canal
      channel = supabase
        .channel('order-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            
            if (isAdmin && payload.eventType === 'INSERT') {
              addNotification('🛒 ¡Nuevo pedido recibido!');
            }
            
            if (!isAdmin && payload.eventType === 'UPDATE') {
              // Comparamos usando la referencia directa del ID
              if (payload.new.user_id === userIdRef.current) {
                addNotification(`📦 Tu pedido ahora está: ${payload.new.status}`);
              }
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    // 3. EL TRUCO MÓVIL: Reconectar cuando el usuario vuelve a mirar el celular
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Celular activo: Reconectando Realtime...");
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
    const newNotif = { 
      text, 
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), 
      id: Date.now() 
    };

    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 10);
      localStorage.setItem('veci_notifications', JSON.stringify(updated));
      return updated;
    });

    setUnread(true);
    
    // En móviles, a veces el navegador bloquea el audio si el usuario no ha tocado la pantalla.
    // El catch() evita que este bloqueo rompa el resto del código.
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch((e) => console.log("Audio bloqueado por el celular", e));
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
          <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white dark:border-black rounded-full scale-110 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <h4 className="font-black text-[10px] uppercase tracking-widest text-zinc-500">Notificaciones</h4>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-zinc-500 text-sm">No hay novedades.</p>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className="p-4 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{n.text}</p>
                  <p className="text-[10px] text-zinc-400 mt-1 font-medium">{n.time}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}