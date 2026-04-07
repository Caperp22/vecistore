'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation'; // IMPORTANTE: Para poder viajar entre páginas

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const router = useRouter(); // Inicializamos el router

  useEffect(() => {
    // Cargar historial al iniciar
    const saved = localStorage.getItem('veci_notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed);
      // Si hay notificaciones guardadas al recargar, prendemos la luz
      if (parsed.length > 0) setUnread(true);
    }

    let channel: any;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const myId = session.user.id;
      const isAdmin = session.user.email === 'caperp22@gmail.com';

      if (isAdmin) {
        // --- ADMIN ---
        channel = supabase
          .channel('admin-channel')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
             // Le pasamos la ruta del panel de admin
             addNotification('🛒 ¡Nuevo pedido recibido!', '/admin/dashboard');
          })
          .subscribe();
      } else {
        // --- CLIENTE ---
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
              // Le pasamos la ruta del perfil del cliente
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

  // Recibe el texto y la RUTA a donde debe llevar
  const addNotification = (text: string, link: string) => {
    const newNotif = { 
      id: Date.now(), // Un ID único para poder borrarla luego
      text, 
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), 
      link // Guardamos a dónde nos debe llevar
    };

    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 10);
      localStorage.setItem('veci_notifications', JSON.stringify(updated));
      return updated;
    });

    setUnread(true); // Encendemos la luz roja

    // Intento de vibración y sonido
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } catch(e) {}
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200]); 
  };

  // --- NUEVA FUNCIÓN: Al hacer clic en una notificación ---
  const leerNotificacion = (idQueVamosABorrar: number, rutaDeDestino: string) => {
    // 1. Filtramos las notificaciones para QUITAR la que acabamos de tocar
    const notificacionesRestantes = notifications.filter(notif => notif.id !== idQueVamosABorrar);
    
    // 2. Actualizamos la pantalla y la memoria del celular
    setNotifications(notificacionesRestantes);
    localStorage.setItem('veci_notifications', JSON.stringify(notificacionesRestantes));
    
    // 3. Si ya no quedan notificaciones, apagamos la luz roja
    if (notificacionesRestantes.length === 0) {
      setUnread(false);
    }

    // 4. Cerramos el menú de la campanita
    setIsOpen(false);

    // 5. ¡Viajamos a la página correspondiente!
    router.push(rutaDeDestino);
  };

  return (
    <div className="relative">
      {/* BOTÓN DE LA CAMPANITA */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 text-zinc-500 hover:text-indigo-600 transition-colors relative flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* LA LUCECITA (Rediseñada para que no se esconda) */}
        {unread && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white dark:border-zinc-900 shadow-sm"></span>
          </span>
        )}
      </button>

      {/* MENÚ DESPLEGABLE */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center">
            <h4 className="font-black text-[10px] uppercase tracking-widest text-zinc-500">Notificaciones</h4>
            <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 text-[10px] font-black px-2 py-1 rounded-full">
              {notifications.length}
            </span>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <span className="text-3xl mb-3 opacity-50">📭</span>
                <p className="text-zinc-500 font-medium text-sm">Bandeja vacía</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button 
                  key={n.id}
                  onClick={() => leerNotificacion(n.id, n.link)} // AQUÍ ESTÁ LA MAGIA DEL CLIC
                  className="w-full text-left p-5 border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group active:scale-95"
                >
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {n.text}
                  </p>
                  <p className="text-[10px] font-black tracking-widest text-zinc-400 mt-2 uppercase">
                    {n.time} • Toque para ver
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}