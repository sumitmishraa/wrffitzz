'use client';
import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ProductCard from './ProductCard';
import SplitHeading from './SplitHeading';

const LETTER_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const SORTS = [
  { value: 'rel', label: 'Most wanted' },
  { value: 'nuevo', label: 'Newest' },
  { value: 'menor', label: 'Price: low to high' },
  { value: 'mayor', label: 'Price: high to low' },
];

function sizeRank(s) {
  const letter = LETTER_SIZES.indexOf(s);
  if (letter !== -1) return letter;
  const n = Number(s);
  if (!Number.isNaN(n)) return 100 + n;
  return 1000;
}

function sortProducts(list, sort) {
  const out = [...list];
  if (sort === 'menor') return out.sort((a, b) => a.price - b.price);
  if (sort === 'mayor') return out.sort((a, b) => b.price - a.price);
  if (sort === 'nuevo') return out.sort((a, b) => Number(!!b.is_new) - Number(!!a.is_new) || String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
  return out.sort(
    (a, b) => Number(!!b.is_bestseller) - Number(!!a.is_bestseller) || (b.rating || 0) - (a.rating || 0)
  );
}

export default function Catalog({
  products = [],
  categories = [],
  activeCategory = null,
  initial = {},
  syncUrl = true,
  title = 'All pieces',
  id = 'tienda',
  white = false,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef(null);
  const inputId = id === 'tienda' ? 'q' : `${id}-q`;
  const [q, setQ] = useState(initial.q || '');
  const [size, setSize] = useState(initial.size || '');
  const [color, setColor] = useState(initial.color || '');
  const [sort, setSort] = useState(SORTS.some((s) => s.value === initial.sort) ? initial.sort : 'rel');

  const sizes = useMemo(() => {
    const set = new Set();
    products.forEach((p) => p.sizes?.forEach((s) => set.add(s)));
    return [...set].sort((a, b) => sizeRank(a) - sizeRank(b));
  }, [products]);

  const colors = useMemo(() => {
    const seen = new Map();
    products.forEach((p) => p.colors?.forEach((c) => { if (!seen.has(c.name)) seen.set(c.name, c); }));
    return [...seen.values()];
  }, [products]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = products.filter((p) => {
      if (size && !p.sizes?.includes(size)) return false;
      if (color && !p.colors?.some((c) => c.name === color)) return false;
      if (needle) {
        const hay = [p.name, p.description, p.category?.name, p.material, ...(p.colors || []).map((c) => c.name)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    return sortProducts(filtered, sort);
  }, [products, q, size, color, sort]);

  // Keep filters in the URL so a filtered view can be shared or reloaded.
  useEffect(() => {
    if (!syncUrl) return;
    const params = new URLSearchParams(window.location.search);
    const set = (k, v) => (v ? params.set(k, v) : params.delete(k));
    set('q', q.trim());
    set('size', size);
    set('color', color);
    set('sort', sort === 'rel' ? '' : sort);
    const qs = params.toString();
    const next = `${pathname}${qs ? `?${qs}` : ''}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      router.replace(next, { scroll: false });
    }
  }, [q, size, color, sort, syncUrl, pathname, router]);

  // The header search button links here with #buscar.
  useEffect(() => {
    if (window.location.hash === '#buscar') {
      searchRef.current?.scrollIntoView({ block: 'center' });
      searchRef.current?.focus({ preventScroll: true });
    }
  }, []);

  const active = [
    size && { key: 'size', label: `Size ${size}`, clear: () => setSize('') },
    color && { key: 'color', label: color, clear: () => setColor('') },
    q.trim() && { key: 'q', label: `“${q.trim()}”`, clear: () => setQ('') },
  ].filter(Boolean);

  const clearAll = () => {
    setSize('');
    setColor('');
    setQ('');
    setSort('rel');
  };

  const catHref = (slug) => (slug ? `/shop/${slug}` : '/shop');

  return (
    <section className={`qs-catalogo ${white ? 'qs-catalogo--blanco' : ''}`} id={id} aria-labelledby={`${id}-titulo`}>
      <div className="qs-catalogo__cab">
        <SplitHeading id={`${id}-titulo`} text={title} />
        <p className="qs-cuenta" aria-live="polite">
          Showing {shown.length} of {products.length} {products.length === 1 ? 'piece' : 'pieces'}
        </p>
      </div>

      {categories.length > 0 && (
        <nav aria-label="Categories">
          <ul className="qs-cats">
            <li>
              <Link href={catHref(null)} className="qs-cat" aria-current={!activeCategory && pathname === '/shop' ? 'page' : undefined}>
                All
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={catHref(c.slug)} className="qs-cat" aria-current={activeCategory === c.slug ? 'page' : undefined}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="qs-filtros" role="search" aria-label="Filter pieces">
        <div className="qs-field qs-filtro qs-filtro--buscar">
          <label className="qs-label" htmlFor={inputId}>Search</label>
          <input
            ref={searchRef}
            id={inputId}
            className="qs-input"
            type="search"
            placeholder="Shirt, linen, black…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
          />
        </div>

        {sizes.length > 1 && (
          <fieldset className="qs-filtro">
            <legend className="qs-label">Size</legend>
            <div className="qs-talles">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="qs-talle"
                  aria-pressed={size === s}
                  onClick={() => setSize(size === s ? '' : s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {colors.length > 1 && (
          <fieldset className="qs-filtro">
            <legend className="qs-label">Colour{color ? <i> · {color}</i> : null}</legend>
            <div className="qs-muestras">
              {colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className="qs-muestra"
                  style={{ '--c': c.hex }}
                  aria-pressed={color === c.name}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => setColor(color === c.name ? '' : c.name)}
                >
                  <span aria-hidden="true" />
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="qs-field qs-filtro qs-filtro--orden">
          <label className="qs-label" htmlFor={`${id}-orden`}>Sort by</label>
          <select id={`${id}-orden`} className="qs-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {active.length > 0 && (
        <div className="qs-activos" aria-label="Active filters" role="group">
          {active.map((f) => (
            <button key={f.key} type="button" className="qs-activo" onClick={f.clear}>
              {f.label}
              <span aria-hidden="true">✕</span>
              <span className="qs-sr">, remove filter</span>
            </button>
          ))}
          <button type="button" className="qs-limpiar" onClick={clearAll}>Clear all</button>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="qs-empty">
          <h2>{products.length === 0 ? 'Nothing here yet' : 'No pieces match'}</h2>
          <p>
            {products.length === 0
              ? 'New pieces for this edit are on the way. The rest of the shop is ready now.'
              : 'Try another size or colour, or clear the filters to see everything.'}
          </p>
          {products.length === 0 ? (
            <Link href="/shop" className="boton boton--lleno">Shop all pieces</Link>
          ) : (
            <button type="button" className="boton boton--lleno" onClick={clearAll}>Clear filters</button>
          )}
        </div>
      ) : (
        <ul className="qs-grilla">
          {shown.map((p, i) => (
            <li key={p.id}>
              <ProductCard product={p} priority={i < 4} index={i} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
