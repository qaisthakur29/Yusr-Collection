import { supabase } from '../lib/supabaseClient';

export interface Product {
  id: string;
  slug: string;
  name: string;
  subname?: string;
  price: number;
  mrp: number;
  image: string;
  gallery?: string[];
  sizes: ('S' | 'M' | 'L' | 'XL' | 'XXL')[];
  description: string;
  category: string;
  fabric: string;
  fit: string;
  tag?: string;
  badge?: string;
  details: string[];
  size_guide_url?: string;
}

const VALID_SIZES: Product['sizes'] = ['S', 'M', 'L', 'XL', 'XXL'];

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  subname: string | null;
  price: number | string;
  mrp: number | string;
  image: string;
  gallery: string[] | null;
  sizes: string[] | null;
  description: string;
  category: string;
  fabric: string;
  fit: string;
  tag: string | null;
  badge: string | null;
  details: string[] | null;
  size_guide_url: string | null;
};

function mapRowToProduct(row: ProductRow): Product {
  const sizes = (row.sizes ?? []).filter((size): size is Product['sizes'][number] =>
    (VALID_SIZES as string[]).includes(size),
  );

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subname: row.subname ?? undefined,
    price: Number(row.price),
    mrp: Number(row.mrp),
    image: row.image,
    gallery: row.gallery ?? undefined,
    sizes: sizes.length > 0 ? sizes : [...VALID_SIZES],
    description: row.description,
    category: row.category,
    fabric: row.fabric,
    fit: row.fit,
    tag: row.tag ?? undefined,
    badge: row.badge ?? undefined,
    details: row.details ?? [],
    size_guide_url: row.size_guide_url ?? undefined,
  };
}

const PRODUCT_COLUMNS =
  'id, slug, name, subname, price, mrp, image, gallery, sizes, description, category, fabric, fit, tag, badge, details, size_guide_url';

export type ProductSort = 'featured' | 'price-asc' | 'price-desc';

export interface FetchProductsOptions {
  limit?: number;
  offset?: number;
  category?: string | null;
  sort?: ProductSort;
}

// Every sort mode falls back to created_at so ties never reorder between loads.
const SORT_ORDER: Record<ProductSort, { column: string; ascending: boolean }[]> = {
  featured: [
    { column: 'sort_order', ascending: true },
    { column: 'created_at', ascending: true },
  ],
  'price-asc': [
    { column: 'price', ascending: true },
    { column: 'created_at', ascending: true },
  ],
  'price-desc': [
    { column: 'price', ascending: false },
    { column: 'created_at', ascending: true },
  ],
};

export async function fetchProductsFromDB(options: FetchProductsOptions = {}): Promise<Product[]> {
  const { limit, offset = 0, category, sort = 'featured' } = options;
  const order = SORT_ORDER[sort] ?? SORT_ORDER.featured;

  let query = supabase.from('products').select(PRODUCT_COLUMNS);

  // PostgREST applies .order() clauses in the sequence they are chained.
  for (const clause of order) {
    query = query.order(clause.column, { ascending: clause.ascending });
  }

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  if (typeof limit === 'number') {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch products:', error.message);
    return [];
  }

  return ((data as ProductRow[]) ?? []).map(mapRowToProduct);
}

/**
 * Total number of products, optionally scoped to a single category.
 * Uses a HEAD request (count only) so no rows travel over the wire.
 */
export async function fetchProductsCount(category?: string | null): Promise<number> {
  let query = supabase.from('products').select('id', { count: 'exact', head: true });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Failed to count products:', error.message);
    return 0;
  }

  return count ?? 0;
}

export async function fetchProductCategories(): Promise<string[]> {
  const { data, error } = await supabase.from('products').select('category').order('category');

  if (error) {
    console.error('Failed to fetch categories:', error.message);
    return [];
  }

  return Array.from(
    new Set(((data as { category: string | null }[]) ?? []).map((row) => row.category).filter(Boolean)),
  ) as string[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch product:', error.message);
    return null;
  }

  if (!data) return null;
  return mapRowToProduct(data as ProductRow);
}

export const SIZE_CHART = [
  { size: 'S', chest: '42"', length: '28"', shoulder: '21"', sleeve: '8.5"' },
  { size: 'M', chest: '44"', length: '29"', shoulder: '22"', sleeve: '9.0"' },
  { size: 'L', chest: '46"', length: '30"', shoulder: '23"', sleeve: '9.5"' },
  { size: 'XL', chest: '48"', length: '31"', shoulder: '24"', sleeve: '10.0"' },
  { size: 'XXL', chest: '50"', length: '32"', shoulder: '25"', sleeve: '10.5"' },
];
