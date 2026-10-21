import Link from 'next/link';
import ProductCard from './ProductCard';
import SplitHeading from './SplitHeading';

export default function NewArrivalsGrid({ products = [] }) {
  const featured = [...products]
    .sort((a, b) => Number(!!b.is_new) - Number(!!a.is_new))
    .slice(0, 8);

  return (
    <section className="estrellas" id="estrellas" aria-labelledby="e-titulo">
      <div className="estrellas__cab">
        <SplitHeading id="e-titulo" text="New arrivals" />
        <p>Available now. Made in small runs at our Bangalore atelier.</p>
      </div>

      <ul className="qs-grilla">
        {featured.map((p, i) => (
          <li key={p.id}>
            <ProductCard product={p} priority={i < 4} index={i} />
          </li>
        ))}
      </ul>

      <div className="estrellas__todas">
        <Link href="/shop" className="boton boton--lleno">
          Shop all {products.length} pieces
        </Link>
      </div>
    </section>
  );
}
