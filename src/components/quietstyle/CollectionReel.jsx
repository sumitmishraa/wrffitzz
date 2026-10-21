'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatINR } from '@/lib/pricing';
import SplitHeading from './SplitHeading';

function ReelItem({ p, hidden }) {
  return (
    <li aria-hidden={hidden || undefined}>
      <Link href={`/product/${p.slug}`} className="cinta-p" tabIndex={hidden ? -1 : undefined}>
        <span className="cinta-p__foto">
          <Image src={p.images?.[0] || ''} alt="" fill sizes="300px" />
        </span>
        <span className="cinta-p__n">{p.name}</span>
        <span className="cinta-p__p">{formatINR(p.price)}</span>
      </Link>
    </li>
  );
}

export default function CollectionReel({ products = [] }) {
  const [paused, setPaused] = useState(false);

  return (
    <section className="cats" id="categorias" aria-labelledby="cats-titulo">
      <div className="cats__in">
        <div className="cats__cab">
          <div>
            <SplitHeading id="cats-titulo" text="The collection" />
            <p className="cats__sub">All {products.length} atelier pieces, worn in.</p>
          </div>
          <div className="qs-reel-acciones">
            <button
              type="button"
              className="qs-reel-pausa"
              aria-pressed={paused}
              onClick={() => setPaused(!paused)}
            >
              {paused ? 'Play' : 'Pause'}<span className="qs-sr"> the moving collection</span>
            </button>
            <Link className="cats__todo" href="/shop">Shop all</Link>
          </div>
        </div>

        <div className={`cinta-pr ${paused ? 'qs-pausado' : ''}`}>
          <ul className="cinta-pr__pista" aria-label="All pieces">
            {products.map((p) => <ReelItem key={`a-${p.id}`} p={p} />)}
            {products.map((p) => <ReelItem key={`b-${p.id}`} p={p} hidden />)}
          </ul>
        </div>
      </div>
    </section>
  );
}
