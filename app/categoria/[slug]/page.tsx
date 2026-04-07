import { supabase } from '../../../lib/supabase';
import { notFound } from 'next/navigation';
import ProductCard from '../../../components/ProductCard'; 

export const revalidate = 0; // Forzamos a que siempre busque datos frescos

export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const { data: category } = await supabase.from('categories').select('*').eq('slug', slug).single();
  if (!category) notFound(); 

  const { data: products } = await supabase.from('products').select('*').eq('category_id', category.id).order('created_at', { ascending: false });

  return (
    <div className="py-10">
      {/* Cabecera Minimalista */}
      <div className="mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <h1 className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight capitalize">
          {category.name}
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400 font-medium text-lg">
          Explora nuestra colección exclusiva de {category.name.toLowerCase()}
        </p>
      </div>

      {/* Grilla de Productos o Mensaje de Vacío */}
      {products?.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-4xl]">
          <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">Aún no hay creaciones en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {/* Aquí llamamos a la tarjeta por cada producto */}
          {products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}