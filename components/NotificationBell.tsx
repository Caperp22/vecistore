'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  
  const router = useRouter(); 
  const pathname = usePathname(); 
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // 1. Cargar historial
    const saved = localStorage.getItem('veci_notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed);
      if (parsed.length > 0) setUnread(true);
    }

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const myId = session.user.id;
      const isAdmin = session.user.email === 'caperp22@gmail.com';

      // 2. Limpiar conexiones viejas
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      // 3. Crear canal único
      const newChannel = supabase.channel(`notifs-${myId}-${Date.now()}`);
      channelRef.current = newChannel;

      if (isAdmin) {
        newChannel
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
             toast.success('🛒 ¡Nuevo pedido recibido!'); 
             addNotification('🛒 ¡Nuevo pedido recibido!', '/admin/dashboard');
          })
          .subscribe();
      } else {
        newChannel
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
          .subscribe((status) => {
            if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setTimeout(setupRealtime, 2000); // Autoreconexión
            }
          });
      }
    };

    setupRealtime();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(setupRealtime, 1000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
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

  const manejarClicNotificacion = (idQueVamosABorrar: number, rutaDeDestino?: string) => {
    const notificacionesRestantes = notifications.filter(notif => notif.id !== idQueVamosABorrar);
    setNotifications(notificacionesRestantes);
    localStorage.setItem('veci_notifications', JSON.stringify(notificacionesRestantes));
    if (notificacionesRestantes.length === 0) setUnread(false);
    setIsOpen(false);

    if (rutaDeDestino) {
      if (pathname === rutaDeDestino) {
        window.location.reload(); 
      } else {
        router.push(rutaDeDestino);
      }
    }
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
        {/* 🔥 AQUÍ ESTÁ EL ARREGLO RESPONSIVO: -right-4 y w-[90vw] para celulares */}
        <div className="absolute -right-4 sm:right-0 mt-4 w-[90vw] sm:w-[22rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden">
          
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center">
            <h4 className="font-black text-[10px] uppercase tracking-widest text-zinc-500">Notificaciones</h4>
            {notifications.length > 0 && (
              <button 
                onClick={limpiarTodas}
                className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-wider bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors active:scale-95"
              >
                Limpiar
              </button>
            )}
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <span className="text-4xl mb-3 opacity-50">📭</span>
                <p className="text-zinc-500 font-medium text-sm">Bandeja vacía</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button 
                  key={n.id}
                  onClick={() => manejarClicNotificacion(n.id, n.link)}
                  className="w-full text-left p-5 border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group active:scale-95"
                >
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {n.text}
                      </p>
                      <p className="text-[10px] font-black tracking-widest text-zinc-400 mt-2 uppercase">
                        {n.time}
                      </p>
                    </div>
                    
                    {n.link && (
                      <span className="shrink-0 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors shadow-sm">
                        Ir ➔
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}