'use client';

import { useState, useEffect, useRef } from 'react';

// --- COMPONENTE SELECTOR PREMIUM ---
const StatusSelector = ({ estadoActual, onCambiarEstado, isHistorial }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const todosLosEstados = [
    { nombre: 'Pendiente', color: 'bg-yellow-500', shadow: 'shadow-yellow-500/50', icon: '🟡' },
    { nombre: 'En preparación', color: 'bg-blue-500', shadow: 'shadow-blue-500/50', icon: '🔵' },
    { nombre: 'Enviado', color: 'bg-purple-500', shadow: 'shadow-purple-500/50', icon: '🟣' },
    { nombre: 'Entregado', color: 'bg-green-500', shadow: 'shadow-green-500/50', icon: '🟢' }
  ];

  const estadosPermitidos = isHistorial 
    ? todosLosEstados.filter(e => e.nombre === 'Enviado' || e.nombre === 'Entregado')
    : todosLosEstados;

  const estadoSeleccionado = todosLosEstados.find(e => e.nombre === estadoActual) || todosLosEstados[0];

  useEffect(() => {
    const handleClickFuera = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  return (
    <div className="relative w-full" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center bg-white hover:bg-zinc-50 dark:bg-[#0A0A0A] dark:hover:bg-[#111] border border-zinc-200 hover:border-indigo-500 dark:border-zinc-800 dark:hover:border-indigo-500 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-white transition-all duration-200 shadow-sm whitespace-nowrap"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs shrink-0">{estadoSeleccionado.icon}</span>
          {estadoActual}
        </div>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ml-2 shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 w-full min-w-[160px] mt-1 bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {estadosPermitidos.map((estado) => (
            <button
              key={estado.nombre}
              onClick={() => {
                onCambiarEstado(estado.nombre);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800
                ${estadoActual === estado.nombre ? 'bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}
              `}
            >
              <span className="text-xs shrink-0">{estado.icon}</span>
              {estado.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DE PEDIDOS ---
export default function OrdersTab({ pedidos, products, updateOrderStatus }: { pedidos: any[], products: any[], updateOrderStatus: any }) {
  const [orderFilter, setOrderFilter] = useState('Pendiente'); 
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        {['Pendiente', 'En preparación', 'Enviado', 'Historial'].map((f) => {
          const cantidad = f === 'Historial' 
            ? pedidos.filter(p => p.status === 'Entregado').length
            : pedidos.filter(p => p.status === f).length;
          const isSelected = orderFilter === f;

          return (
            <button 
              key={f}
              onClick={() => setOrderFilter(f)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                isSelected 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' 
                  : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              {f === 'Historial' ? '📦 Historial' : f}
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                isSelected 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}>
                {cantidad}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {pedidos
          .filter(p => {
            if (orderFilter === 'Historial') return p.status === 'Entregado';
            return p.status === orderFilter;
          })
          .map(pedido => (
            <div key={pedido.id} className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-12 gap-6 hover:border-indigo-500/40 transition-colors shadow-sm items-center">
              
              <div className="lg:col-span-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-xl shrink-0">👤</div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight truncate">{pedido.customer_info?.name}</h4>
                  <p className="text-zinc-500 text-xs mt-0.5 truncate">{pedido.customer_info?.phone}</p>
                  <p className="text-zinc-400 text-[10px] mt-1 uppercase tracking-wider">{new Date(pedido.created_at).toLocaleDateString()} • {new Date(pedido.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>

              <div className="lg:col-span-5 bg-zinc-50 dark:bg-[#0A0A0A] p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 w-full">
                <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-2 px-1">Artículos (Clic para ver detalle)</p>
                <div className="space-y-1">
                  {pedido.items.map((item: any, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedProduct(item)}
                      className="w-full flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 p-2 hover:bg-white dark:hover:bg-zinc-800/80 rounded-lg transition-all group shadow-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px] shrink-0">{item.cantidad}x</span> 
                        <span className="line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-left" title={item.title}>{item.title}</span>
                      </div>
                      <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3 flex lg:flex-col justify-between items-center lg:items-end gap-3 w-full">
                <div className="text-left lg:text-right w-full lg:w-auto">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-0.5">Total</p>
                  <h5 className="text-xl font-black text-zinc-900 dark:text-white">${pedido.total.toLocaleString('es-CO')}</h5>
                </div>
                <div className="w-48 sm:w-56 shrink-0">
                  {pedido.status === 'Entregado' ? (
                    <div className="w-full flex justify-between items-center bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl px-4 py-2.5 text-sm font-bold text-green-700 dark:text-green-400 shadow-sm cursor-default">
                      <div className="flex items-center gap-2">
                        <span className="text-xs shrink-0">🟢</span>
                        Entregado
                      </div>
                      <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <StatusSelector 
                      estadoActual={pedido.status} 
                      isHistorial={orderFilter === 'Historial'}
                      // 🔥 Pasamos el ID, el nuevo estado, y los datos del cliente para WhatsApp
                      onCambiarEstado={(nuevoEstado: string) => 
                        updateOrderStatus(
                          pedido.id, 
                          nuevoEstado, 
                          pedido.customer_info?.phone, 
                          pedido.customer_info?.name
                        )
                      }
                    />
                  )}
                </div>
              </div>

            </div>
          ))}
          
          {pedidos.filter(p => (orderFilter === 'Historial' ? p.status === 'Entregado' : p.status === orderFilter)).length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-[#111] rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="text-3xl opacity-50 mb-2 block">📭</span>
              <p className="text-zinc-500 text-sm font-medium">No hay pedidos en esta sección</p>
            </div>
          )}
      </div>

      {/* MODAL DE DETALLES DEL PRODUCTO */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative animate-in zoom-in-95">
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors z-10 backdrop-blur-md"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {(() => {
              const dbProduct = products.find(p => p.title === selectedProduct.title);
              const imageUrl = selectedProduct.image_url || dbProduct?.image_url || 'https://via.placeholder.com/400?text=Sin+Imagen';
              const description = dbProduct?.description || 'Sin descripción detallada guardada.';
              
              return (
                <>
                  <div className="h-64 w-full bg-zinc-100 dark:bg-zinc-900 relative">
                    <img src={imageUrl} alt={selectedProduct.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{selectedProduct.title}</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 leading-relaxed">{description}</p>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-50 dark:bg-[#0A0A0A] p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Precio Unitario</p>
                        <p className="font-bold text-zinc-900 dark:text-white">${selectedProduct.price?.toLocaleString('es-CO')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Cant. Solicitada</p>
                        <p className="font-black text-lg text-indigo-600 dark:text-indigo-400">{selectedProduct.cantidad} unid.</p>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}