import { getProducts, getCategories } from '@/lib/catalog';
import ShopView from '@/components/quietstyle/ShopView';

const GENDER_TITLES = { men: "Men's pieces", women: "Women's pieces" };

function titleFor(category, match) {
  if (GENDER_TITLES[category]) return GENDER_TITLES[category];
  if (match) return match.name;
  return category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const categories = await getCategories();
  const title = titleFor(category, categories.find((c) => c.slug === category));
  return {
    title: `${title} · wrfitzz`,
    description: `Shop ${title.toLowerCase()} from wrfitzz, made in small runs in Bangalore.`,
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { category } = await params;
  const query = await searchParams;
  const isGender = Boolean(GENDER_TITLES[category]);

  const [products, categories] = await Promise.all([
    isGender ? getProducts({ gender: category }) : getProducts({ category }),
    getCategories(),
  ]);
  const match = categories.find((c) => c.slug === category);

  return (
    <ShopView
      title={titleFor(category, match)}
      eyebrow={isGender ? 'The collection' : 'Category'}
      phrase={match?.description}
      image={match?.image_url || '/images/products/geometric-shirt-combo.jpg'}
      products={products}
      categories={categories.filter((c) => c.slug !== 'best-seller')}
      activeCategory={category}
      initial={{ q: query?.q, size: query?.size, color: query?.color, sort: query?.sort }}
    />
  );
}
