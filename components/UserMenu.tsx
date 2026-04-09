'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAppContext } from './Providers';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function UserMenu() {
  const { user } = useAppContext();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 🔥 ESTADOS DEL MODAL DE EDICIÓN DE PERFIL
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [actualizando, setActualizando] = useState(false);

  // Sincronizar datos si el usuario cambia
  useEffect(() => {
    if (user) {
      setNombre(user.user_metadata?.full_name || '');
      setTelefono(user.user_metadata?.phone || '');
      setDireccion(user.user_metadata?.address || '');
    }
  }, [user]);

  // Cerrar el menú si hacemos clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push('/');
  };

  // 🔥 FUNCIÓN PARA GUARDAR EL PERFIL
  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setActualizando(true);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: nombre, phone: telefono, address: direccion }
    });

    if (error) {
      toast.error('Error al actualizar: ' + error.message);
    } else {
      toast.success('¡Perfil actualizado con éxito! ✨');
      setIsEditModalOpen(false);
      router.refresh();
    }
    setActualizando(false);
  };

  if (!user) {
    return (
      <Link href="/login" className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      
      {/* BOTÓN DEL ICONO DEL USUARIO */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`p-2 transition-all rounded-xl border ${isOpen ? 'bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-transparent'} focus:outline-none`}
      >
         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      </button>

      {/* MENÚ DESPLEGABLE */}
      {isOpen && (
         <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-[60] animate-in fade-in zoom-in-95 origin-top-right">
            
            {/* Cabecera del menú */}
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#0A0A0A]">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Conectado como</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{user.email}</p>
            </div>
            
            {/* Opciones */}
            <div className="p-3 space-y-1">
              <Link 
                href="/perfil" 
                onClick={() => setIsOpen(false)} 
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-lg">🛍️</span> Mis Pedidos
              </Link>
              
              {/* 🔥 NUEVO BOTÓN PARA ABRIR MODAL */}
              <button 
                onClick={() => { setIsOpen(false); setIsEditModalOpen(true); }} 
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
              >
                <span className="text-lg">⚙️</span> Editar Perfil
              </button>
              
              <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2 mx-2"></div>
              
              <button 
                onClick={handleSignOut} 
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
              >
                <span className="text-lg">🚪</span> Cerrar Sesión
              </button>
            </div>
         </div>
      )}

      {/* 🔥 MODAL FLOTANTE (Queda por encima de todo) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative animate-in zoom-in-95">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80 flex justify-between items-center">
              <h2 className="text-xl font-bold">Mis Datos de Envío</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleGuardarPerfil} className="p-6 space-y-4 text-left">
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