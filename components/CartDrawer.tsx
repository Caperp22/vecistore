'use client';

import { useEffect } from 'react';
import { useAppContext } from './Providers';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart } = useAppContext();
  const router = useRouter();

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

  // 🔥 Botón que te lleva a la página de pago
  const handleIrAPagar = () => {
    closeCart();
    router.push('/carrito');
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeCart} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-[#0A0A0A] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-zinc-800">
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>🛒</span> Tu Pedido
          </h2>
          <button onClick={closeCart} className="p-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <span className="text-6xl mb-4">🛍️</span>
              <p className="text-zinc-500 font-medium">Tu carrito está vacío</p>
            </div>
          ) : (
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
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#0A0A0A]">
            <div className="flex justify-between items-end mb-6">
              <span className="text-zinc-500 font-medium">Subtotal</span>
              <span className="text-3xl font-black text-zinc-900 dark:text-white">${total.toLocaleString('es-CO')}</span>
            </div>
            <button 
              onClick={handleIrAPagar}
              className="w-full bg-indigo-600 text-white font-bold py-4 px-6 rounded-2xl hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20"
            >
              Continuar
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}