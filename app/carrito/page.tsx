'use client';

import { useState } from 'react';
import { useAppContext } from '../../components/Providers';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function CarritoPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, user } = useAppContext();
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);
  const router = useRouter();

  const total = cart.reduce((suma, producto) => suma + (producto.price * (producto.cantidad || 1)), 0);

  // 👇 COLOCA TU NÚMERO AQUÍ
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
      toast.error('Ocurrió un error. No se encontró el usuario.');
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
      toast.success('¡Pedido registrado con éxito!');
      router.push('/'); // Regresar al inicio después de comprar
    } catch (error: any) {
      toast.error('Error al registrar el pedido: ' + error.message);
    } finally {
      setProcesando(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="py-24 text-center max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-[#111111] p-12 rounded-4xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🛒</span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">Tu carrito está vacío</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">Aún no has agregado ninguna creación a tu pedido.</p>
          <Link href="/" className="inline-block bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold py-4 px-8 rounded-2xl hover:scale-105 transition-transform duration-300">
            Explorar la Tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-5xl mx-auto px-4">
      <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4 flex items-center gap-4">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Caja de Pago</h1>
        <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 py-1 px-3 rounded-full text-xs font-bold">
          Paso Final
        </span>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LISTA Y OBSERVACIONES (Izquierda - Más compacta) */}
        <div className="grow space-y-4">
          <ul className="space-y-4">
            {cart.map((producto, index) => (
              <li key={index} className="bg-white dark:bg-[#111111] p-3 sm:p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm flex flex-col sm:flex-row items-center gap-4 relative group transition-all hover:shadow-md">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0">
                  <img src={producto.image_url} alt={producto.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="grow text-center sm:text-left w-full">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight pr-8">{producto.title}</h3>
                    <button onClick={() => removeFromCart(producto.id)} className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors" title="Eliminar producto">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
                    <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-800">
                      <button onClick={() => updateQuantity(producto.id, (producto.cantidad || 1) - 1)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold transition-all">-</button>
                      <span className="w-8 text-center font-bold text-sm text-zinc-900 dark:text-white">{producto.cantidad || 1}</span>
                      <button onClick={() => updateQuantity(producto.id, (producto.cantidad || 1) + 1)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold transition-all">+</button>
                    </div>
                    <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                      ${(producto.price * (producto.cantidad || 1)).toLocaleString('es-CO')}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm mt-4">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
              <span>📝</span> Instrucciones Especiales
            </label>
            <textarea 
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="¿Algún detalle de color, empaque de regalo o nota especial?"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 resize-none"
            />
          </div>
        </div>

        {/* RESUMEN DE COMPRA (Derecha - Fijo y Compacto) */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white dark:bg-[#111111] p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-lg sticky top-20">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">Resumen Final</h2>
            
            <div className="space-y-2 mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} items)</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">${total.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">Por acordar</span>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mb-6 flex justify-between items-end">
              <span className="text-sm text-zinc-900 dark:text-white font-bold">Total Final</span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white">${total.toLocaleString('es-CO')}</span>
            </div>
            
            {!user ? (
              <button 
                onClick={() => router.push('/login')}
                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-3.5 px-6 rounded-2xl hover:scale-[1.02] transition-transform shadow-md text-base text-center"
              >
                Inicia Sesión para Pedir
              </button>
            ) : (
               // 🔥 BOTÓN UNIFICADO Y COMPACTO 🔥
               <button 
                 onClick={handleCheckout}
                 disabled={procesando}
                 className={`w-full flex justify-between items-center p-4 rounded-2xl bg-[#01a884] text-white shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all group ${procesando ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#019373]'}`}
               >
                 <div className="text-left">
                   <p className="text-[9px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Total</p>
                   <p className="text-2xl font-black tracking-tight flex items-baseline gap-1">
                     <span className="text-sm font-medium opacity-90">$</span>
                     {procesando ? '...' : total.toLocaleString('es-CO')}
                   </p>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   <span className="text-base font-bold tracking-tight">
                     {procesando ? 'Procesando...' : 'Realizar Pedido'}
                   </span>
                   <span className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                   </span>
                 </div>
               </button>
            )}
            
            <p className="text-center text-[10px] text-zinc-400 mt-5 font-medium leading-relaxed">
              El pago se coordina directamente por WhatsApp de forma segura.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}