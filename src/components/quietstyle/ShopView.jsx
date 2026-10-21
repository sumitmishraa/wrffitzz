import Image from 'next/image';
import Link from 'next/link';
import Catalog from './Catalog';

export default function ShopView({ title, eyebrow, phrase, image, products, categories, activeCategory = null, initial }) {
  return (
    <div className="pagina-cat">
      <header className="cat-hero">
        <div className="cat-hero__texto rev">
          <nav aria-label="Breadcrumb">
            <ol className="qs-migas">
              <li><Link href="/">Home</Link></li>
              {activeCategory ? (
                <>
                  <li><Link href="/shop">Shop</Link></li>
                  <li><span aria-current="page">{title}</span></li>
                </>
              ) : (
                <li><span aria-current="page">Shop</span></li>
              )}
            </ol>
          </nav>
          <p className="cat-hero__et">{eyebrow}</p>
          <h1>{title}</h1>
          {phrase && <p className="cat-hero__frase">{phrase}</p>}
        </div>
        {image && (
          <div className="cat-hero__foto">
            <Image src={image} alt="" fill priority sizes="(max-width: 900px) 100vw, 50vw" />
          </div>
        )}
      </header>

      <Catalog
        products={products}
        categories={categories}
        activeCategory={activeCategory}
        initial={initial}
        title={activeCategory ? title : 'All pieces'}
      />
    </div>
  );
}
