import { getCategories } from '@/lib/catalog';
import QuietHeader from '@/components/quietstyle/QuietHeader';
import QuietFooter from '@/components/quietstyle/QuietFooter';
import QuietCartDrawer from '@/components/quietstyle/QuietCartDrawer';
import MotionEffects from '@/components/quietstyle/MotionEffects';

export default async function StoreLayout({ children }) {
  const categories = (await getCategories()).filter((c) => c.slug !== 'best-seller');

  return (
    <>
      <a className="saltar" href="#main">Skip to content</a>
      <MotionEffects />
      <QuietHeader categories={categories} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <QuietFooter categories={categories} />
      <QuietCartDrawer />
    </>
  );
}
