'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function WhatsappTab({ templates, setTemplates }: { templates: any[], setTemplates: any }) {
  const [loading, setLoading] = useState(false);
  // Clonamos los templates para poder editarlos antes de guardar
  const [editData, setEditData] = useState<any[]>(templates);

  const handleTextChange = (status: string, newText: string) => {
    setEditData(prev => prev.map(t => t.status === status ? { ...t, message: newText } : t));
  };

  const handleGuardar = async (status: string, message: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .update({ message })
        .eq('status', status);

      if (error) throw error;
      
      // Actualizamos el estado global para que el cambio sea instantáneo
      setTemplates((prev: any[]) => prev.map(t => t.status === status ? { ...t, message } : t));
      toast.success(`Mensaje de "${status}" actualizado 💾`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Plantillas de WhatsApp</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Personaliza los mensajes automáticos. Usa exactamente la palabra <strong className="text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-1 rounded">[CLIENTE]</strong> donde quieras que aparezca el nombre de la persona.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {editData.map((template) => (
          <div key={template.status} className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col">
            
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">
                {template.status === 'En preparación' ? '🛠️' : template.status === 'Enviado' ? '🚀' : '📦'}
              </span>
              <h3 className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-sm">
                {template.status}
              </h3>
            </div>

            <textarea
              rows={6}
              value={template.message}
              onChange={(e) => handleTextChange(template.status, e.target.value)}
              className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:border-indigo-500 text-sm resize-none mb-4 flex-grow"
              placeholder="Escribe tu mensaje aquí..."
            />

            {/* El botón solo se activa si hay cambios sin guardar */}
            <button
              onClick={() => handleGuardar(template.status, template.message)}
              disabled={loading || templates.find(t => t.status === template.status)?.message === template.message}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}