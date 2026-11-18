const UPLOAD_MARKER = '/upload/';

/**
 * Injects Cloudinary's auto-format / auto-quality / width transformations into
 * a delivery URL, so the browser downloads a web-optimized image instead of the
 * original heavy upload.
 *
 *   .../upload/v1234/image.jpg -> .../upload/f_auto,q_auto,w_800/v1234/image.jpg
 *
 * URLs that are not Cloudinary delivery URLs (e.g. local `/assets/...` files)
 * are returned untouched, and a URL that already carries transformations is
 * never transformed twice.
 */
export function optimizeImage(url: string | null | undefined, width = 800): string {
  if (!url) return '';

  const markerIndex = url.indexOf(UPLOAD_MARKER);
  if (markerIndex === -1) return url;

  const prefix = url.slice(0, markerIndex + UPLOAD_MARKER.length);
  const rest = url.slice(markerIndex + UPLOAD_MARKER.length);

  // Cloudinary keeps transformations in the first path segment after /upload/,
  // while the version segment looks like "v1234" — so the presence of a known
  // transform param means this URL was already optimized.
  const firstSegment = rest.split('/')[0] ?? '';
  if (/(^|,)(f_auto|q_auto|w_\d+)/.test(firstSegment)) return url;

  return `${prefix}f_auto,q_auto,w_${width}/${rest}`;
}

const BRAND = 'Yusr Collection';

/** Lowercase + strip accents, so "YŪSR" and "Yusr" compare equal. */
function normaliseForMatch(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Builds the `alt` text for a product image from live product data, so a newly
 * added Supabase product always gets an SEO-friendly alt without any manual
 * work. Every product <img> in the app must go through this function.
 *
 * Catalogue names are already descriptive (e.g. "YŪSR "Tawakkul" Serene Ocean
 * Oversized Tee"), so the brand and the category are appended only when the
 * name does not already carry them. That keeps the output free of duplicated
 * words no matter how a future product happens to be named.
 *
 *   buildProductAlt(product)            -> 'YŪSR "Tawakkul" Serene Ocean Oversized Tee'
 *   buildProductAlt(product, 'view 2')  -> '... Oversized Tee — view 2'
 */
export function buildProductAlt(
  product: { name: string; category?: string | null },
  variant?: string,
): string {
  const name = (product.name ?? '').trim();
  const category = (product.category ?? '').trim();
  const haystack = normaliseForMatch(name);

  const segments: string[] = [];
  if (name) segments.push(haystack.includes('yusr') ? name : `${BRAND} ${name}`);

  // "Tees" -> "tee", so a name ending in "... Oversized Tee" is recognised as
  // already naming the garment type.
  const garment = normaliseForMatch(category).replace(/s$/, '');
  if (garment && !haystack.includes(garment)) segments.push(category);

  if (variant) segments.push(variant);

  // Never ship an empty alt, even if a row somehow has no name.
  if (segments.length === 0) segments.push(BRAND);

  return segments.join(' — ');
}
