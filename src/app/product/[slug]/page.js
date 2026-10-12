import { getProductBySlug, getRelatedProducts } from '@/lib/api';
import ProductDetailClient from '@/components/ProductDetailClient';
import ProductCard from '@/components/ProductCard';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found - wrfitzz' };
  return {
    title: `${product.name} - wrfitzz`,
    description: product.description,
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category_id, product.id, 4);

  return (
    <>
      <div className="pdp">
        <div className="container">
          <ProductDetailClient product={product} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-header__title">You May Also Like</h2>
            </div>
            <div className="product-grid stagger-children">
              {related.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
