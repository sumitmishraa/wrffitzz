'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ShopFilters({ categories, activeSlug }) {
  const pathname = usePathname();

  return (
    <div className="shop__filters">
      <Link
        href="/shop"
        className={`shop__filter-btn ${!activeSlug && pathname === '/shop' ? 'shop__filter-btn--active' : ''}`}
      >
        All
      </Link>
      {categories.map(cat => (
        <Link
          key={cat.id}
          href={`/shop/${cat.slug}`}
          className={`shop__filter-btn ${activeSlug === cat.slug ? 'shop__filter-btn--active' : ''}`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
