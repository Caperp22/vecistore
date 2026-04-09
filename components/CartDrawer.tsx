'use client';

import { useEffect, useState } from 'react';
import { useAppContext } from './Providers';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, user, clearCart } = useAppContext();
  const router = useRouter();

  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);

  const total = cart.reduce((suma, producto) => suma + (producto.price * (producto.cantidad || 1)), 0);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const numeroWhatsApp = "573124208054"; 

  const generarMensajeWhatsApp = () => {
    let texto = `¡Hola! Vengo de VeciStore y quiero hacer el siguiente pedido:\n\n`;
    
    cart.forEach((prod, index) => {
      const subtotal = prod.price * (prod.cantidad || 1);
      texto += `${index + 1}. *${prod.title}* (Cant: ${prod.cantidad || 1}) - $${subtotal.toLocaleString('es-CO')}\n`;
    });

    if (observaciones.trim() !== '') {
      texto += `\n📝 *Observaciones del producto:*\n"${observaciones}"\n`;
    }

    texto += `\n💰 *Total a pagar: $${total.toLocaleString('es-CO')}*\n`;

    texto += `\n👤 *DATOS DE ENVÍO:*\n`;
    texto += `Nombre: ${user?.user_metadata?.full_name || 'No especificado'}\n`;
    texto += `Teléfono: ${user?.user_metadata?.phone || 'No especificado'}\n`;
    texto += `Dirección: ${user?.user_metadata?.address || 'No especificada'}\n`;
    
    texto += `\n¿Me confirmas disponibilidad y medios de pago, por favor?`;
    
    return `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(texto)}`;
  };

  const handleCheckout = async () => {
    if (!user) {
      closeCart();
      router.push('/login');
      toast.info('Inicia sesión para finalizar tu pedido 👀');
      return;
    }
    
    setProcesando(true);
    
    try {
      const { error } = await supabase.from('orders').insert([
        {
          user_id: user.id,
          total: total,
          items: cart,
          observations: observaciones,
          customer_info: {
            name: user.user_metadata?.full_name || 'Sin nombre',
            phone: user.user_metadata?.phone || 'Sin teléfono',
            address: user.user_metadata?.address || 'Sin dirección',
            email: user.email
          }
        }
      ]);
      
      if (error) throw error;

      const linkWa = generarMensajeWhatsApp();
      window.open(linkWa, '_blank');
      
      clearCart();
      closeCart();
      setObservaciones('');
      toast.success('¡Pedido registrado con éxito! 🎉');
      
    } catch (error: any) {
      toast.error('Error al registrar el pedido: ' + error.message);
    } finally {
      setProcesando(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex justify-end">
      
      {/* Overlay oscuro */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={closeCart}
      />
      
      {/* Panel Lateral Deslizante */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#0A0A0A] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-zinc-800">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>🛒</span> Tu Pedido
          </h2>
          <button 
            onClick={closeCart}
            className="p-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Zona Central (Lista + Observaciones) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <span className="text-6xl mb-4">🛍️</span>
              <p className="text-zinc-500 font-medium">Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {cart.map((producto, index) => (
                  <div key={index} className="flex gap-4 bg-zinc-50 dark:bg-[#111] p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 relative group">
                    <img src={producto.image_url} alt={producto.title} className="w-20 h-20 rounded-xl object-cover bg-white dark:bg-zinc-900" />
                    
                    <div className="flex-1 flex flex-col justify-between py-1 pr-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-2 leading-tight">{producto.title}</h4>
                        <button onClick={() => removeFromCart(producto.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-white dark:bg-[#0A0A0A] rounded-lg border border-zinc-200 dark:border-zinc-800 px-2 py-1">
                          <button onClick={() => updateQuantity(producto.id, (producto.cantidad || 1) - 1)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold px-1">-</button>
                          <span className="text-xs font-bold text-zinc-900 dark:text-white w-6 text-center">{producto.cantidad || 1}</span>
                          <button onClick={() => updateQuantity(producto.id, (producto.cantidad || 1) + 1)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold px-1">+</button>
                        </div>
                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                          ${(producto.price * (producto.cantidad || 1)).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                  <span>📝</span> Instrucciones Especiales
                </label>
                <textarea 
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Empaque de regalo, color, detalle..."
                  className="w-full px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
                />
              </div>
            </>
          )}
        </div>

        {/* 🔥 ZONA INFERIOR RENOVADA (Estilo Botón Unido) */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#0A0A0A]">
            
            {!user ? (
               <button 
                 onClick={() => { closeCart(); router.push('/login'); }}
                 className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 px-6 rounded-2xl hover:scale-[1.02] transition-transform shadow-md text-base text-center"
               >
                 Inicia Sesión para Pedir
               </button>
            ) : (
               // 🔥 ESTE ES EL NUEVO BOTÓN UNIDO 🔥
               <button 
                 onClick={handleCheckout}
                 disabled={procesando}
                 className={`w-full flex justify-between items-center p-5 rounded-2xl bg-[#01a884] text-white shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all ${procesando ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#019373]'}`}
               >
                 {/* Parte Izquierda: Total stacking vertical */}
                 <div className="text-left">
                   <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Total</p>
                   <p className="text-2xl font-black tracking-tight flex items-baseline gap-1.5">
                     <span className="text-base font-medium opacity-90">$</span>
                     {procesando ? '...' : total.toLocaleString('es-CO')}
                   </p>
                 </div>
                 
                 {/* Parte Derecha: Acción con Flecha encerrada */}
                 <div className="flex items-center gap-3">
                   <span className="text-lg font-bold tracking-tight">
                     {procesando ? 'Procesando...' : 'Realizar Pedido'}
                   </span>
                   {/* Ícono de flecha con círculo de fondo sutil */}
                   <span className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                   </span>
                 </div>
               </button>
            )}
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}