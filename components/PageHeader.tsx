'use client';

export default function PageHeader({ title, subtitle, icon, backgroundImage }: { 
  title: string, 
  subtitle?: string, 
  icon?: string, 
  backgroundImage?: string 
}) {
  return (
    <div className="relative w-full mb-10 overflow-hidden rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl">
      {/* Imagen de fondo con overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
        style={{ backgroundImage: `url(${backgroundImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop'})` }}
      />
      {/* Efecto translúcido (Glassmorphism) */}
      <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-md" />

      {/* Contenido del Banner */}
      <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/80 dark:bg-zinc-800/80 rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-inner border border-white dark:border-zinc-700/50">
          {icon || '✨'}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2 italic">
            {title}
          </h1>
          {subtitle && (
            <p className="text-zinc-600 dark:text-zinc-400 font-medium text-sm md:text-lg tracking-wide">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}