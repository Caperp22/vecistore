'use client';

import { useMemo } from 'react';

export default function MetricsTab({ pedidos }: { pedidos: any[] }) {
  const stats = useMemo(() => {
    const totalVentas = pedidos.reduce((acc, p) => acc + p.total, 0);
    const ventasHoy = pedidos.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length;
    const ticketPromedio = pedidos.length > 0 ? Math.round(totalVentas / pedidos.length) : 0;
    
    const catMap: any = {};
    const prodMap: any = {};
    const clientMap: any = {}; 

    pedidos.forEach(p => {
      p.items.forEach((item: any) => {
        const catName = item.category_name || 'General'; 
        catMap[catName] = (catMap[catName] || 0) + (item.price * item.cantidad);
        prodMap[item.title] = (prodMap[item.title] || 0) + item.cantidad;
      });

      const clientName = p.customer_info?.name || 'Desconocido';
      clientMap[clientName] = (clientMap[clientName] || 0) + p.total;
    });

    const topProducts = Object.entries(prodMap).sort(([, a]: any, [, b]: any) => b - a).slice(0, 5);
    const topClientes = Object.entries(clientMap).sort(([, a]: any, [, b]: any) => b - a).slice(0, 5);

    const ultimos7Dias = Array.from({length: 7}).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i)); 
      const dateStr = d.toDateString();
      const dayName = d.toLocaleDateString('es-CO', { weekday: 'short' }).toUpperCase();
      
      const totalDia = pedidos
        .filter(p => new Date(p.created_at).toDateString() === dateStr)
        .reduce((acc, p) => acc + p.total, 0);
        
      return { nombre: dayName, total: totalDia };
    });

    const maxVentaDia = Math.max(...ultimos7Dias.map(d => d.total)) || 1;

    return { totalVentas, ventasHoy, ticketPromedio, catMap, topProducts, topClientes, ultimos7Dias, maxVentaDia };
  }, [pedidos]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ingresos Totales</p>
          <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">${stats.totalVentas.toLocaleString('es-CO')}</h3>
          <span className="absolute top-4 right-4 text-3xl opacity-10 group-hover:opacity-20 transition-opacity rotate-12">💰</span>
        </div>
        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Pedidos Totales</p>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{pedidos.length}</h3>
          <span className="absolute top-4 right-4 text-3xl opacity-10 group-hover:opacity-20 transition-opacity -rotate-12">📦</span>
        </div>
        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ventas Hoy</p>
          <h3 className="text-2xl font-black text-green-500">{stats.ventasHoy}</h3>
          <span className="absolute top-4 right-4 text-3xl opacity-10 group-hover:opacity-20 transition-opacity rotate-12">🔥</span>
        </div>
        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ticket Promedio</p>
          <h3 className="text-2xl font-black text-amber-500">${stats.ticketPromedio.toLocaleString('es-CO')}</h3>
          <span className="absolute top-4 right-4 text-3xl opacity-10 group-hover:opacity-20 transition-opacity -rotate-12">💳</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111] p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h4 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">📈 Rendimiento (Últimos 7 Días)</h4>
            <p className="text-xs text-zinc-500 mt-1">Evolución de ingresos en la última semana</p>
          </div>
        </div>
        
        <div className="h-48 w-full flex items-end justify-between gap-2 sm:gap-4 mt-4">
          {stats.ultimos7Dias.map((dia: any, idx: number) => {
            const alturaPorcentaje = (dia.total / stats.maxVentaDia) * 100;
            return (
              <div key={idx} className="flex flex-col items-center justify-end w-full h-full group relative">
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none z-10 whitespace-nowrap">
                  ${dia.total.toLocaleString('es-CO')}
                </div>
                <div 
                  className={`w-full max-w-[3rem] rounded-t-lg transition-all duration-1000 ${dia.total === stats.maxVentaDia ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-zinc-200 dark:bg-zinc-800 group-hover:bg-indigo-300 dark:group-hover:bg-indigo-900'}`}
                  style={{ height: `${Math.max(alturaPorcentaje, 5)}%` }} 
                ></div>
                <span className="text-[10px] font-bold text-zinc-500 mt-3">{dia.nombre}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <h4 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-zinc-500">🛍️ Top Vendidos</h4>
          <div className="space-y-3">
            {stats.topProducts.map(([name, qty]: any, idx: number) => (
              <div key={name} className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className={`font-black text-xs ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-zinc-400' : idx === 2 ? 'text-amber-700' : 'text-zinc-600 dark:text-zinc-500'}`}>#{idx + 1}</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">{name}</span>
                </div>
                <span className="text-zinc-900 dark:text-white font-bold shrink-0">{qty} und.</span>
              </div>
            ))}
            {stats.topProducts.length === 0 && <p className="text-xs text-zinc-500 italic">No hay datos suficientes.</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <h4 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-zinc-500">📊 Por Categoría</h4>
          <div className="space-y-4 mt-2">
            {Object.entries(stats.catMap).map(([cat, val]: any) => (
              <div key={cat} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-600 dark:text-zinc-400">{cat}</span>
                  <span className="text-zinc-900 dark:text-white">${val.toLocaleString('es-CO')}</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full transition-all duration-1000 rounded-full" style={{ width: `${(val / stats.totalVentas) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {Object.keys(stats.catMap).length === 0 && <p className="text-xs text-zinc-500 italic">No hay datos suficientes.</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -z-10 blur-2xl"></div>
          <h4 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-zinc-500">👑 Clientes VIP</h4>
          <div className="space-y-3">
            {stats.topClientes.map(([name, val]: any, idx: number) => (
              <div key={name} className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] shrink-0">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤'}
                  </div>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">{name}</span>
                </div>
                <span className="text-green-600 dark:text-green-400 font-bold shrink-0">${val.toLocaleString('es-CO')}</span>
              </div>
            ))}
            {stats.topClientes.length === 0 && <p className="text-xs text-zinc-500 italic">No hay datos suficientes.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}