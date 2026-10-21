import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts } from '@/lib/catalog';
import ProductView from '@/components/quietstyle/ProductView';
import ProductCard from '@/components/quietstyle/ProductCard';
import SplitHeading from '@/components/quietstyle/SplitHeading';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Piece not found · wrfitzz' };
  return {
    title: `${product.name} · wrfitzz`,
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
      <ProductView product={product} />

      {related.length > 0 && (
        <section className="rel-sec" aria-labelledby="rel-titulo">
          <div className="rel-cab">
            <SplitHeading id="rel-titulo" text="More from the edit" />
            <p>Pieces that sit well with this one.</p>
          </div>
          <ul className="qs-grilla">
            {related.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} index={i} />
              </li>
            ))}
          </ul>
          <div className="rel-todas">
            <Link href="/shop" className="boton boton--lleno">Shop all pieces</Link>
          </div>
        </section>
      )}
    </>
  );
}
