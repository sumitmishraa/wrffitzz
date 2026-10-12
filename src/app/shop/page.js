import ProductCard from '@/components/ProductCard';
import { getProducts, getCategories } from '@/lib/api';
import ShopFilters from '@/components/ShopFilters';

export const metadata = {
  title: 'Shop All - wrfitzz',
  description: 'Browse our complete collection of premium clothing. Shop shirts, trousers, dresses, and accessories.',
};

export default async function ShopPage({ searchParams }) {
  const params = await searchParams;
  const gender = params?.gender;

  const [products, categories] = await Promise.all([
    getProducts({ gender }),
    getCategories(),
  ]);

  let title = 'Shop All';
  if (gender === 'men') title = "Men's Collection";
  if (gender === 'women') title = "Women's Collection";

  return (
    <div className="shop">
      <div className="container">
        <div className="shop__header">
          <h1 className="shop__title">{title}</h1>
          <p className="shop__count">{products.length} products</p>
        </div>

        <ShopFilters categories={categories} />

        <div className="product-grid stagger-children">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
