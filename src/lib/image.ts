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
