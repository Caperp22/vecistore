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
    <div className="py-10 max-w-5xl mx-auto px-4">
      <div className="mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-6 flex items-center gap-4">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Caja de Pago</h1>
        <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 py-1 px-3 rounded-full text-sm font-bold">
          Paso Final
        </span>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* LISTA Y OBSERVACIONES (Izquierda) */}
        <div className="grow space-y-6">
          <ul className="space-y-6">
            {cart.map((producto, index) => (
              <li key={index} className="bg-white dark:bg-[#111111] p-5 sm:p-6 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm flex flex-col sm:flex-row items-center gap-6 relative group transition-all hover:shadow-md">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0">
                  <img src={producto.image_url} alt={producto.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="grow text-center sm:text-left w-full">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight pr-8">{producto.title}</h3>
                    <button onClick={() => removeFromCart(producto.id)} className="absolute top-6 right-6 text-zinc-400 hover:text-red-500 transition-colors" title="Eliminar producto">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4 line-clamp-1">{producto.description}</p>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                    <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 rounded-xl p-1 border border-zinc-200 dark:border-zinc-800">
                      <button onClick={() => updateQuantity(producto.id, (producto.cantidad || 1) - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold transition-all">-</button>
                      <span className="w-10 text-center font-bold text-zinc-900 dark:text-white">{producto.cantidad || 1}</span>
                      <button onClick={() => updateQuantity(producto.id, (producto.cantidad || 1) + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold transition-all">+</button>
                    </div>
                    <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      ${(producto.price * (producto.cantidad || 1)).toLocaleString('es-CO')}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm mt-6">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
              <span>📝</span> Instrucciones Especiales
            </label>
            <textarea 
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="¿Algún detalle de color, empaque de regalo o nota especial?"
              className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
          </div>
        </div>

        {/* RESUMEN DE COMPRA (Derecha - Fijo) */}
        <div className="lg:w-96 shrink-0">
          <div className="bg-white dark:bg-[#111111] p-8 rounded-4xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-lg sticky top-24">
            <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-6 tracking-tight">Resumen Final</h2>
            
            <div className="space-y-4 mb-6 text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} items)</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">${total.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">Por acordar</span>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8 flex justify-between items-end">
              <span className="text-zinc-900 dark:text-white font-bold">Total Final</span>
              <span className="text-3xl font-black text-zinc-900 dark:text-white">${total.toLocaleString('es-CO')}</span>
            </div>
            
            {!user ? (
              <button 
                onClick={() => router.push('/login')}
                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 px-6 rounded-2xl hover:scale-[1.02] transition-transform shadow-md text-lg text-center"
              >
                Inicia Sesión para Pedir
              </button>
            ) : (
               // 🔥 BOTÓN ESTILO WHATSAPP (Como la foto) 🔥
               <button 
                 onClick={handleCheckout}
                 disabled={procesando}
                 className={`w-full flex justify-between items-center p-5 rounded-3xl bg-[#01a884] text-white shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all group ${procesando ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#019373]'}`}
               >
                 <div className="text-left">
                   <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Total</p>
                   <p className="text-2xl font-black tracking-tight flex items-baseline gap-1.5">
                     <span className="text-base font-medium opacity-90">$</span>
                     {procesando ? '...' : total.toLocaleString('es-CO')}
                   </p>
                 </div>
                 
                 <div className="flex items-center gap-3">
                   <span className="text-lg font-bold tracking-tight">
                     {procesando ? 'Procesando...' : 'Realizar Pedido'}
                   </span>
                   <span className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                   </span>
                 </div>
               </button>
            )}
            
            <p className="text-center text-xs text-zinc-400 mt-6 font-medium">
              El pago se coordina directamente por WhatsApp de forma segura.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}