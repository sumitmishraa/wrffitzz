import { connection } from 'next/server';
import { getCategories, getSettings } from '@/lib/catalog';
import QuietHeader from '@/components/quietstyle/QuietHeader';
import QuietFooter from '@/components/quietstyle/QuietFooter';
import QuietCartDrawer from '@/components/quietstyle/QuietCartDrawer';
import MotionEffects from '@/components/quietstyle/MotionEffects';

export default async function StoreLayout({ children }) {
  // Render per request so admin edits (store details, categories) show without a redeploy
  await connection();
  const [allCategories, settings] = await Promise.all([getCategories(), getSettings()]);
  const categories = allCategories.filter((c) => c.slug !== 'best-seller');

  return (
    <>
      <a className="saltar" href="#main">Skip to content</a>
      <MotionEffects />
      <QuietHeader categories={categories} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <QuietFooter categories={categories} settings={settings} />
      <QuietCartDrawer whatsappNumber={settings.whatsapp_number} />
    </>
  );
}
