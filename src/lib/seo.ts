// Technical SEO: per-route <title>, meta description, canonical and Open Graph
// tags.
//
// The storefront is a client-rendered SPA, so the tags in index.html only ever
// describe the homepage. This module rewrites the relevant <head> elements on
// every route change instead of pulling in a head-management library: the app
// only needs five tags, and React 19 + this toolchain already has a fragile
// dependency tree (see the `--legacy-peer-deps` note in package.json scripts).
//
// Every function here is called from a single effect in App.tsx so the final
// state of <head> is decided in exactly one place.

import type { Product } from '../data/products';
import { optimizeImage } from './image';

// Canonical production origin. vite.config.ts holds the same value for
// sitemap.xml — the two must stay in sync or crawlers get contradictory signals.
export const SITE_URL = 'https://yusrcollection.store';
export const SITE_NAME = 'YUSR COLLECTION';

export const DEFAULT_DESCRIPTION =
  'Rooted in Faith. Built on Struggles. Premium, heavyweight 240 GSM modest streetwear crafted for the believers.';

// Used as the social preview image for pages that have no image of their own.
export const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/aistudio/HERO_SECTION_BANNER_83e65a6d.jpg`;

export interface PageSeo {
  title: string;
  description: string;
}

const HOME_SEO: PageSeo = {
  title: 'YUSR COLLECTION | Premium Islamic Streetwear',
  description: DEFAULT_DESCRIPTION,
};

// Titles and descriptions for every static route. Kept in one map so the HTML
// sitemap page can reuse the same copy the <head> gets.
export const STATIC_ROUTE_SEO: Record<string, PageSeo> = {
  '/': HOME_SEO,
  '/shop': {
    title: 'Shop All Oversized Tees | YUSR COLLECTION',
    description:
      'Browse the full YUSR COLLECTION drop: heavyweight 240 GSM oversized tees with modest, faith-led graphics. Free shipping on prepaid orders across India.',
  },
  '/about': {
    title: 'Our Story | YUSR COLLECTION',
    description:
      'Yusr means ease. Read how YUSR COLLECTION crafts modest, high-end streetwear for believers who carry their legacy with pride.',
  },
  '/returns': {
    title: 'Returns & Size Exchange Policy | YUSR COLLECTION',
    description:
      'One-time size exchange within 48 hours, free replacement on defects with an unboxing video, and no refunds on made-to-order prints.',
  },
  '/faq': {
    title: 'FAQ — Sizing, COD & Delivery | YUSR COLLECTION',
    description:
      'Answers on made-to-order timelines, Cash on Delivery, oversized sizing, washing care and order cancellations.',
  },
  '/policy': {
    title: 'Privacy Policy | YUSR COLLECTION',
    description:
      'How YUSR COLLECTION collects, uses and protects your personal information, including payment and delivery data.',
  },
  '/terms': {
    title: 'Terms & Conditions | YUSR COLLECTION',
    description:
      'The terms governing purchases, pricing, cancellations and liability when you order from YUSR COLLECTION.',
  },
  '/track-order': {
    title: 'Track Your Order | YUSR COLLECTION',
    description:
      'Enter your order details to check the current status of your YUSR COLLECTION shipment.',
  },
  '/contact': {
    title: 'Contact Us | YUSR COLLECTION',
    description:
      'Reach YUSR COLLECTION on WhatsApp or email for order updates, sizing advice and exchange requests.',
  },
  '/html-sitemap': {
    title: 'Site Map | YUSR COLLECTION',
    description:
      'A plain list of every page on YUSR COLLECTION, including all current products.',
  },
  // Not listed publicly (robots.txt disallows it) but it still gets its own
  // canonical so a signed-in admin never canonicalises to the homepage.
  '/admin': {
    title: 'Admin | YUSR COLLECTION',
    description: 'Internal order and catalogue management for YUSR COLLECTION.',
  },
};

// Public pages shown on the HTML sitemap, in the order they are listed there.
export const PUBLIC_ROUTES: { path: string; label: string }[] = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Shop All' },
  { path: '/about', label: 'Our Story' },
  { path: '/faq', label: 'FAQ' },
  { path: '/returns', label: 'Returns & Exchange' },
  { path: '/track-order', label: 'Track Order' },
  { path: '/contact', label: 'Contact' },
  { path: '/policy', label: 'Privacy Policy' },
  { path: '/terms', label: 'Terms & Conditions' },
  { path: '/html-sitemap', label: 'Site Map' },
];

// ---------------------------------------------------------------------------
// <head> helpers
// ---------------------------------------------------------------------------

function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/** Turns a site-relative path or image reference into an absolute URL. */
function absoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
}

/** Compresses whitespace and trims to a search-snippet-friendly length. */
function toMetaDescription(text: string, fallback = DEFAULT_DESCRIPTION, max = 160): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return fallback;
  if (clean.length <= max) return clean;

  const clipped = clean.slice(0, max - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${(lastSpace > 80 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

interface SeoInput {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  type?: 'website' | 'product';
}

function applySeo({ title, description, canonical, image, type = 'website' }: SeoInput): void {
  const ogImage = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;

  document.title = title;
  upsertCanonical(canonical);

  upsertMeta('name', 'description', description);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', ogImage);

  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:type', type);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:image', ogImage);
}

/** Canonical URL of a static route. '/' keeps its trailing slash; others do not. */
export function staticCanonical(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

/**
 * Applies the metadata for a static route. Unknown paths fall back to the
 * homepage copy and canonicalise to '/', which is the standard soft-404 signal.
 */
export function applyStaticSeo(path: string): void {
  const seo = STATIC_ROUTE_SEO[path] ?? HOME_SEO;
  applySeo({
    title: seo.title,
    description: seo.description,
    canonical: STATIC_ROUTE_SEO[path] ? staticCanonical(path) : staticCanonical('/'),
  });
}

/**
 * Canonical URL of a product page. The slug is percent-encoded so this matches
 * the <loc> that vite-plugin-sitemap writes for the same product.
 */
export function productCanonical(slug: string): string {
  return `${SITE_URL}/product/${encodeURIComponent(slug)}`;
}

/** Applies product-specific metadata pulled from Supabase. */
export function applyProductSeo(product: Product): void {
  applySeo({
    title: `${product.name} | ${SITE_NAME}`,
    description: toMetaDescription(
      product.description,
      `Buy ${product.name} from YUSR COLLECTION — heavyweight 240 GSM oversized tee with a made-to-order custom print.`,
    ),
    canonical: productCanonical(product.slug),
    // 1200px keeps the social preview sharp while staying inside the size
    // limits social scrapers enforce. optimizeImage is a no-op on local assets.
    image: optimizeImage(product.image, 1200) || DEFAULT_OG_IMAGE,
    type: 'product',
  });
}
