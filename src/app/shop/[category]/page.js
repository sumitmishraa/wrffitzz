import ProductCard from '@/components/ProductCard';
import ShopFilters from '@/components/ShopFilters';
import { getProducts, getCategories } from '@/lib/api';

export async function generateMetadata({ params }) {
  const { category } = await params;
  let formatted = category.charAt(0).toUpperCase() + category.slice(1);
  if (category === 'men') formatted = "Men's Streetwear";
  if (category === 'women') formatted = "Women's Streetwear";
  return {
    title: `${formatted} - wrfitzz`,
    description: `Shop premium ${formatted.toLowerCase()} from wrfitzz. Discover handcrafted quality and timeless style.`,
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const isGenderCategory = category === 'men' || category === 'women';

  const [products, categories] = await Promise.all([
    isGenderCategory ? getProducts({ gender: category }) : getProducts({ category }),
    getCategories(),
  ]);

  const matchedCat = categories.find(c => c.slug === category);
  let formatted = matchedCat ? matchedCat.name : category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  if (category === 'men') formatted = "Men's Collection";
  if (category === 'women') formatted = "Women's Collection";

  return (
    <div className="shop">
      <div className="container">
        <div className="shop__header">
          <h1 className="shop__title">{formatted}</h1>
          <p className="shop__count">{products.length} products</p>
        </div>

        <ShopFilters categories={categories} activeSlug={category} />

        {products.length > 0 ? (
          <div className="product-grid stagger-children">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="cart-empty">
            <p className="cart-empty__icon">🔍</p>
            <h2 className="cart-empty__title">No products found</h2>
            <p className="cart-empty__text">We&apos;re adding new {formatted.toLowerCase()} soon. Check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
}
