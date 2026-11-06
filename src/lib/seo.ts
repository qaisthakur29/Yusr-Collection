// Technical SEO: per-route <title>, meta description, canonical, Open Graph
// tags and JSON-LD structured data.
//
// The storefront is a client-rendered SPA, so the tags in index.html only ever
// describe the homepage. This module rewrites the relevant <head> elements on
// every route change instead of pulling in a head-management library: the app
// only needs a handful of tags, and React 19 + this toolchain already has a
// fragile dependency tree (see the `--legacy-peer-deps` note in package.json
// scripts).
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

// Single source of truth for the FAQ page. FaqPage renders these strings and
// applyStaticSeo turns the same array into FAQPage structured data, so the
// visible copy and the schema can never drift apart.
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'How long will it take to deliver my order?',
    a: 'Since every piece is made-to-order and custom-printed just for you, it takes 3-5 days for printing and packing. After that, shipping takes 4-7 days. Total time: 7-10 working days.',
  },
  {
    q: 'Do you offer Cash on Delivery (COD)?',
    a: 'Yes, COD is available across India. However, we highly recommend Prepaid orders (UPI/Card) to get an extra ₹50 discount and faster processing.',
  },
  {
    q: 'How do I choose the right size?',
    a: 'Our tees have an oversized, drop-shoulder fit. Please refer to our Size Chart on the product page before ordering. If you are in between sizes or prefer a regular fit, we suggest sizing down.',
  },
  {
    q: 'Can I cancel my order?',
    a: 'Orders can only be cancelled within 12 hours of placing them. Once the printing process starts (which is usually within 24 hours), cancellations are not possible as the product is custom-made.',
  },
  {
    q: 'Will the print fade after washing?',
    a: 'No. We use premium DTG/DTF printing. Wash inside out in cold water, and do not iron directly on the print. It will last a long time.',
  },
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

// Exactly one JSON-LD <script> is kept in <head>, tagged with this id. Sharing a
// single element between routes is what stops a Product schema being left behind
// after the visitor navigates back to a static page.
const JSON_LD_SCRIPT_ID = 'seo-json-ld';

/**
 * Replaces the page's structured data, or removes it when `data` is null.
 * JSON-LD is inert markup — Google reads it, browsers never execute it.
 */
function upsertJsonLd(data: Record<string, unknown> | null): void {
  const existing = document.getElementById(JSON_LD_SCRIPT_ID);

  if (!data) {
    existing?.remove();
    return;
  }

  const script = (existing ?? document.createElement('script')) as HTMLScriptElement;
  if (!existing) {
    script.id = JSON_LD_SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  // textContent rather than innerHTML: the serialised JSON is data, and must
  // never be reparsed as markup.
  script.textContent = JSON.stringify(data);
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

// ---------------------------------------------------------------------------
// Structured data (JSON-LD)
// ---------------------------------------------------------------------------

// Logo file the Navbar and Footer already render, so the schema and the visible
// brand asset can never drift apart.
const LOGO_URL = `${SITE_URL}/assets/aistudio/YUSR_COLLECTION_REMOVED_BG_LOGO_82f5c6c0.png`;

/** Site-wide entity: who publishes this store. */
function organizationSchema(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    // @id lets the WebSite/Product nodes reference this one node instead of
    // repeating the company details in every schema.
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: LOGO_URL,
    description: DEFAULT_DESCRIPTION,
  };
}

/**
 * The site as an entity. Deliberately has no `potentialAction`/SearchAction —
 * Google requires a real search endpoint for that, and the storefront has none.
 */
function websiteSchema(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

/**
 * Product schema for a product page.
 *
 * `availability` is hard-coded to InStock because the `products` table has no
 * stock column — every piece is made to order. If stock is ever tracked, this is
 * the one place that has to read it.
 */
function productSchema(
  product: Product,
  canonical: string,
  image: string,
): Record<string, unknown> {
  return {
    '@type': 'Product',
    '@id': `${canonical}#product`,
    name: product.name,
    description: toMetaDescription(product.description, `Buy ${product.name} from ${SITE_NAME}.`),
    image: [image],
    sku: product.id,
    category: product.category,
    url: canonical,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      url: canonical,
      price: product.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

/**
 * FAQ rich-result schema. Google expects each `acceptedAnswer` to match text
 * that is actually visible on the page, which is why this reads from the same
 * FAQ_ITEMS array the FaqPage renders.
 */
function faqSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

interface SeoInput {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  type?: 'website' | 'product';
  /** Structured data for this route, or null to clear whatever was set before. */
  jsonLd?: Record<string, unknown> | null;
  /** robots directive. Defaults to indexable; soft-404s opt out. */
  robots?: string;
}

function applySeo({
  title,
  description,
  canonical,
  image,
  type = 'website',
  jsonLd = null,
  robots = 'index,follow',
}: SeoInput): void {
  const ogImage = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;

  document.title = title;
  upsertCanonical(canonical);

  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', robots);
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

  upsertJsonLd(jsonLd);
}

/** Canonical URL of a static route. '/' keeps its trailing slash; others do not. */
export function staticCanonical(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

/**
 * Applies the metadata for a known static route. Unknown paths are handled by
 * applyNotFoundSeo so they never canonicalise into the homepage's index entry.
 */
export function applyStaticSeo(path: string): void {
  const seo = STATIC_ROUTE_SEO[path] ?? HOME_SEO;

  // Organization + WebSite belong to the site as a whole, so only the homepage
  // carries them. /faq owns a FAQPage node. Every other route explicitly clears
  // whatever structured data ran before.
  let jsonLd: Record<string, unknown> | null = null;
  if (path === '/') {
    jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [organizationSchema(), websiteSchema()],
    };
  } else if (path === '/faq') {
    jsonLd = faqSchema();
  }

  applySeo({
    title: seo.title,
    description: seo.description,
    canonical: STATIC_ROUTE_SEO[path] ? staticCanonical(path) : staticCanonical('/'),
    jsonLd,
  });
}

/** True when the app can render a real page for this path. */
export function isKnownRoute(path: string): boolean {
  return path === '/' || path in STATIC_ROUTE_SEO;
}

/**
 * Metadata for a URL that matches no route, or a product slug that does not
 * exist. The storefront is client-rendered, so the server has already answered
 * 200 — `noindex` is what keeps this soft 404 out of the index, and the
 * canonical points at the homepage rather than at the dead URL.
 */
export function applyNotFoundSeo(): void {
  applySeo({
    title: 'Page Not Found | YUSR COLLECTION',
    description:
      'The page you are looking for does not exist. Browse the YUSR COLLECTION catalogue or head back to the homepage.',
    canonical: staticCanonical('/'),
    robots: 'noindex,follow',
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
  const canonical = productCanonical(product.slug);
  // 1200px keeps the social preview sharp while staying inside the size
  // limits social scrapers enforce. optimizeImage is a no-op on local assets.
  const image = optimizeImage(product.image, 1200) || DEFAULT_OG_IMAGE;

  applySeo({
    title: `${product.name} | ${SITE_NAME}`,
    description: toMetaDescription(
      product.description,
      `Buy ${product.name} from YUSR COLLECTION — heavyweight 240 GSM oversized tee with a made-to-order custom print.`,
    ),
    canonical,
    image,
    type: 'product',
    jsonLd: {
      '@context': 'https://schema.org',
      // Structured data wants an absolute image URL; absoluteUrl is a no-op on
      // the Cloudinary URLs optimizeImage returns.
      ...productSchema(product, canonical, absoluteUrl(image)),
    },
  });
}
