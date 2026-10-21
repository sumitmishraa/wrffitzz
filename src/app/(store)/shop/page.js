import { getProducts, getCategories } from '@/lib/catalog';
import ShopView from '@/components/quietstyle/ShopView';

export const metadata = {
  title: 'Shop all · wrfitzz',
  description: 'Every wrfitzz piece in one place: shirts, trousers, dresses and accessories, made in small runs in Bangalore.',
};

const GENDER_TITLES = { men: "Men's pieces", women: "Women's pieces" };

export default async function ShopPage({ searchParams }) {
  const params = await searchParams;
  const gender = GENDER_TITLES[params?.gender] ? params.gender : undefined;

  const [products, categories] = await Promise.all([getProducts({ gender }), getCategories()]);

  return (
    <ShopView
      title={gender ? GENDER_TITLES[gender] : 'Shop all'}
      eyebrow="The collection"
      phrase="Everyday pieces, made in small runs."
      image="/images/products/geometric-shirt-combo.jpg"
      products={products}
      categories={categories.filter((c) => c.slug !== 'best-seller')}
      initial={{ q: params?.q, size: params?.size, color: params?.color, sort: params?.sort }}
    />
  );
}
