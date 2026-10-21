import HeroStage from './HeroStage';
import NewArrivalsGrid from './NewArrivalsGrid';
import Catalog from './Catalog';
import CollectionReel from './CollectionReel';

// Header, footer and the bag drawer come from app/(store)/layout.js.
export default function QuietStorePage({ products = [], categories = [] }) {
  return (
    <>
      <HeroStage />
      <NewArrivalsGrid products={products} />
      <Catalog products={products} categories={categories} syncUrl={false} />
      <CollectionReel products={products} />
    </>
  );
}
