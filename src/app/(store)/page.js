import { getProducts, getCategories } from '@/lib/catalog';
import QuietStorePage from '@/components/quietstyle/QuietStorePage';

export const revalidate = 0;

export default async function HomePage() {
  const [products, categories] = await Promise.all([getProducts({ limit: 50 }), getCategories()]);

  return (
    <QuietStorePage
      products={products}
      categories={categories.filter((c) => c.slug !== 'best-seller')}
    />
  );
}
