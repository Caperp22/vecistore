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
      router.push('/'); 
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
    // 🔥 CAMBIO 1: max-w-7xl para más ancho de página
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 🔥 CAMBIO 2: Título actualizado y más ancho */}
      <div className="mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-5 flex items-center gap-5">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Resumen de Pedido</h1>
        <span className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 py-1.5 px-4 rounded-full text-sm font-bold flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Paso Final
        </span>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LISTA Y OBSERVACIONES (Izquierda - Más ancha ahora) */}
        <div className="grow space-y-5">
          <ul className="space-y-5">
            {cart.map((producto, index) => (
              <li key={index} className="bg-white dark:bg-[#111111] p-4 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm flex flex-col sm:flex-row items-center gap-5 relative group transition-all hover:shadow-lg">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0 border border-zinc-200 dark:border-zinc-800">
                  <img src={producto.image_url} alt={producto.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="grow text-center sm:text-left w-full">
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight pr-10">{producto.title}</h3>
                    <button onClick={() => removeFromCart(producto.id)} className="absolute top-5 right-5 text-zinc-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Eliminar producto">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                    <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 rounded-xl p-1 border border-zinc-200 dark:border-zinc-800">
                      <button onClick={() => updateQuantity(producto.id, (producto.cantidad || 1) - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold transition-all">-</button>
                      <span className="w-10 text-center font-bold text-base text-zinc-900 dark:text-white">{producto.cantidad || 1}</span>
                      <button onClick={() => updateQuantity(producto.id, (producto.cantidad || 1) + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold transition-all">+</button>
                    </div>
                    <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      ${(producto.price * (producto.cantidad || 1)).toLocaleString('es-CO')}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm mt-5">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2.5 flex items-center gap-2.5">
              <span>📝</span> Instrucciones Especiales
            </label>
            <textarea 
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="¿Algún detalle de color, empaque de regalo o nota especial?"
              className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-base text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 resize-none"
            />
          </div>
        </div>

        {/* RESUMEN DE COMPRA (Derecha - Fijo y Compacto) */}
        <div className="lg:w-96 shrink-0">
          <div className="bg-white dark:bg-[#111111] p-6 rounded-4xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xl sticky top-24">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-5 tracking-tight flex items-center gap-3">
              <span>📋</span> Resumen Final
            </h2>
            
            <div className="space-y-3 mb-5 text-base text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} items)</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-200">${total.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Envío</span>
                <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full font-medium">Por acordar</span>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5 mb-7 flex justify-between items-end">
              <span className="text-base text-zinc-900 dark:text-white font-bold">Total Final</span>
              <span className="text-3xl font-black text-zinc-900 dark:text-white leading-none">${total.toLocaleString('es-CO')}</span>
            </div>
            
            {!user ? (
              <button 
                onClick={() => router.push('/login')}
                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 px-6 rounded-2xl hover:scale-[1.02] transition-transform shadow-md text-base text-center"
              >
                Inicia Sesión para Pedir
              </button>
            ) : (
               // 🔥 CAMBIO 3: BOTÓN DE WHATSAPP RESTAURADO Y LIMPIO 🔥
               <button 
                 onClick={handleCheckout}
                 disabled={procesando}
                 className={`w-full flex justify-center items-center gap-3 p-5 rounded-2xl bg-[#01a884] text-white shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all text-lg font-bold ${procesando ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#019373]'}`}
               >
                 {procesando ? (
                   <>
                     <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                     <span>Procesando...</span>
                   </>
                 ) : (
                   <>
                    {/* Ícono de WhatsApp */}
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.001 5.45-4.436 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 0 5.414 0 12.05c0 2.123.553 4.197 1.603 6.032L0 24l6.105-1.603a11.803 11.803 0 005.94 1.603h.005c6.632 0 12.05-5.414 12.05-12.05a11.813 11.813 0 00-3.413-8.413z"/></svg>
                    <span>Enviar Pedido por WhatsApp</span>
                   </>
                 )}
               </button>
            )}
            
            <p className="text-center text-xs text-zinc-400 mt-6 font-medium leading-relaxed">
              Al hacer clic, guardarás tu pedido y se abrirá WhatsApp para coordinar el pago de forma segura.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}