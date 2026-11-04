import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import sitemap from 'vite-plugin-sitemap';
import {optimizeImage} from './src/lib/image';

// Canonical production origin. Every <loc> in sitemap.xml is built from this, so
// it must be the domain search engines will index.
const SITE_URL = 'https://yusrcollection.store';

// Brand strings shared by the sitemap and the prerendered product pages. Kept in
// sync by hand with src/lib/seo.ts, which owns the same values at runtime.
const SITE_NAME = 'YUSR COLLECTION';
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/aistudio/HERO_SECTION_BANNER_83e65a6d.jpg`;

// Public path-based routes from App.tsx. '/' is deliberately omitted: the plugin
// already picks it up from dist/index.html, and listing it again would write a
// duplicate <url>. '/admin' is intentionally absent — it is not a public page.
const STATIC_ROUTES = [
  '/shop',
  '/about',
  '/returns',
  '/faq',
  '/policy',
  '/terms',
  '/track-order',
  '/contact',
  '/html-sitemap',
];

// The subset of a product row the build needs to write a static page.
interface PrerenderProduct {
  slug: string;
  name: string;
  description: string;
  image: string;
}

// Product rows live in Supabase, so neither the sitemap nor the prerenderer can
// discover them from the bundle. Read them once at build time from the public
// REST endpoint using the same anon key the storefront already ships with. A
// failure here is logged rather than thrown so a network hiccup can never break
// the deploy — the build then simply emits no product routes.
async function fetchPrerenderProducts(
  supabaseUrl?: string,
  anonKey?: string,
): Promise<PrerenderProduct[]> {
  if (!supabaseUrl || !anonKey) {
    console.warn(
      '[prerender] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — skipping product routes.',
    );
    return [];
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/products?select=slug,name,description,image&order=sort_order.asc`,
      {headers: {apikey: anonKey, Authorization: `Bearer ${anonKey}`}},
    );

    if (!res.ok) {
      console.warn(`[prerender] product request failed with ${res.status} — skipping product routes.`);
      return [];
    }

    const rows = (await res.json()) as Partial<PrerenderProduct>[];
    const products = rows
      .filter((row): row is Partial<PrerenderProduct> & {slug: string} =>
        typeof row?.slug === 'string' && row.slug.length > 0,
      )
      .map((row) => ({
        slug: row.slug,
        name: row.name ?? row.slug,
        description: row.description ?? '',
        image: row.image ?? '',
      }));

    console.log(`[prerender] loaded ${products.length} product(s) for the sitemap and static pages.`);
    return products;
  } catch (err) {
    console.warn('[prerender] could not reach Supabase — skipping product routes.', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Static prerendering of product pages
// ---------------------------------------------------------------------------
//
// WhatsApp (and most link crawlers) never execute JavaScript, so the
// per-product og:image / og:title / og:description that src/lib/seo.ts writes at
// runtime are invisible to them: every shared product link previewed the generic
// homepage tags from index.html.
//
// This plugin emits a genuine HTML file per product route
// (dist/product/<slug>/index.html) by cloning the built index.html and rewriting
// only its <head>. Vercel checks the filesystem before applying rewrites, so
// those files are served directly to crawlers, while the untouched <body> and
// module scripts keep the app hydrating exactly as before for real visitors.

/** Collapses whitespace and clips to a search/social-snippet-friendly length. */
function toMetaDescription(text: string, fallback: string, max = 160): string {
  // Product copy is Markdown. Strip the markers that would otherwise show up
  // verbatim in a WhatsApp preview.
  const plain = (text ?? '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/(\*\*|__|\*|_|`)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) return fallback;
  if (plain.length <= max) return plain;

  const clipped = plain.slice(0, max - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${(lastSpace > 80 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Turns a site-relative path (or bare URL) into an absolute URL. */
function absoluteUrl(value: string): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
}

/** Rewrites an existing <meta> in place, or injects it when the template lacks one. */
function setMetaTag(html: string, kind: 'name' | 'property', key: string, value: string): string {
  const pattern = new RegExp(`(<meta\\s+${kind}="${key}"\\s+content=")[^"]*(")`, 'i');
  if (pattern.test(html)) return html.replace(pattern, `$1${escapeAttr(value)}$2`);
  return html.replace('</head>', `  <meta ${kind}="${key}" content="${escapeAttr(value)}" />\n  </head>`);
}

function setCanonical(html: string, href: string): string {
  const pattern = /(<link\s+rel="canonical"\s+href=")[^"]*(")/i;
  if (pattern.test(html)) return html.replace(pattern, `$1${escapeAttr(href)}$2`);
  return html.replace('</head>', `  <link rel="canonical" href="${escapeAttr(href)}" />\n  </head>`);
}

function buildProductHtml(template: string, product: PrerenderProduct): string {
  const canonical = `${SITE_URL}/product/${encodeURIComponent(product.slug)}`;
  const title = `${product.name} | ${SITE_NAME}`;
  const description = toMetaDescription(
    product.description,
    `Buy ${product.name} from ${SITE_NAME} — heavyweight 240 GSM oversized tee with a made-to-order custom print.`,
  );
  // 1200px keeps the social preview sharp while staying inside the size limits
  // scrapers enforce. optimizeImage is a no-op on local assets.
  const image = absoluteUrl(optimizeImage(product.image, 1200)) || DEFAULT_OG_IMAGE;

  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(title)}</title>`);
  html = setCanonical(html, canonical);
  html = setMetaTag(html, 'name', 'description', description);
  html = setMetaTag(html, 'property', 'og:type', 'product');
  html = setMetaTag(html, 'property', 'og:title', title);
  html = setMetaTag(html, 'property', 'og:description', description);
  html = setMetaTag(html, 'property', 'og:url', canonical);
  html = setMetaTag(html, 'property', 'og:image', image);
  html = setMetaTag(html, 'name', 'twitter:title', title);
  html = setMetaTag(html, 'name', 'twitter:description', description);
  html = setMetaTag(html, 'name', 'twitter:image', image);
  return html;
}

function prerenderProductPages(products: PrerenderProduct[]): Plugin {
  return {
    name: 'prerender-product-pages',
    apply: 'build',
    // 'post' so the main build has already written dist/index.html to clone.
    enforce: 'post',
    async closeBundle() {
      if (products.length === 0) {
        console.warn('[prerender] no products found — no static product pages were written.');
        return;
      }

      let template: string;
      try {
        template = await readFile(path.resolve(__dirname, 'dist/index.html'), 'utf8');
      } catch (err) {
        console.warn('[prerender] dist/index.html not found — skipping static product pages.', err);
        return;
      }

      let written = 0;
      for (const product of products) {
        // Never let a slug escape the output directory.
        if (!/^[\w.-]+$/.test(product.slug) || product.slug.includes('..')) {
          console.warn(`[prerender] skipping unsafe slug: ${product.slug}`);
          continue;
        }

        const file = path.resolve(__dirname, 'dist/product', product.slug, 'index.html');
        await mkdir(path.dirname(file), {recursive: true});
        await writeFile(file, buildProductHtml(template, product), 'utf8');
        written += 1;
      }

      console.log(`[prerender] wrote ${written} static product page(s).`);
    },
  };
}

// Every package that `react-markdown` pulls in. Kept as one pattern so the whole
// dependency tree is classified as a unit rather than drifting between chunks as
// transitive versions change.
const MARKDOWN_MODULES =
  /[\\/]node_modules[\\/](?:react-markdown|@ungap|remark-parse|remark-rehype|unified|bail|trough|zwitch|vfile(?:-message)?|devlop|dequal|ccount|longest-streak|trim-lines|parse-entities|stringify-entities|character-entities(?:-html4|-legacy)?|character-reference-invalid|decode-named-character-reference|property-information|space-separated-tokens|comma-separated-tokens|style-to-object|inline-style-parser|html-url-attributes|estree-util-is-identifier-name|is-alphabetical|is-alphanumerical|is-decimal|is-hexadecimal|is-plain-obj|micromark[a-z-]*|mdast-util[a-z-]*|hast-util[a-z-]*|unist-util[a-z-]*)[\\/]/;

export default defineConfig(async ({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const products = await fetchPrerenderProducts(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const productRoutes = products.map((product) => `/product/${product.slug}`);

  return {
    plugins: [
      react(),
      tailwindcss(),
      sitemap({
        hostname: SITE_URL,
        dynamicRoutes: [...STATIC_ROUTES, ...productRoutes],
        // Emits dist/robots.txt alongside the sitemap. Crawlers may index every
        // public page, but /admin is kept out of the index and off the sitemap.
        generateRobotsTxt: true,
        robots: [{userAgent: '*', allow: '/', disallow: '/admin'}],
      }),
      prerenderProductPages(products),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        output: {
          // Split rarely-changing vendor libraries into their own chunks so the
          // browser can cache them long-term across app-code deploys.
          //
          // This uses rolldown's own `codeSplitting.groups` rather than the
          // Rollup-compatible `output.manualChunks` function. manualChunks is still
          // accepted, but rolldown migrates it into a single group whose `name()`
          // return value is not honoured per module: react and react/jsx-runtime
          // were being swept into whichever chunk imported them first
          // (vendor-icons and vendor-markdown). Because the entry chunk imports
          // react/jsx-runtime statically, that made the whole markdown chunk a
          // modulepreload on the landing page. Explicit groups with priorities are
          // what actually decides membership here.
          //
          // Every `test` uses [\\/] instead of / so it still matches when rolldown
          // reports Windows-style paths.
          codeSplitting: {
            groups: [
              {
                // Highest priority: react, react-dom and scheduler must always land
                // together. If React core is captured by another group, that group
                // becomes a static dependency of the entry chunk.
                name: 'vendor-react',
                test: /[\\/]node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
                priority: 40,
              },
              {
                // react-markdown plus its transitive remark / micromark / mdast /
                // hast / unist packages. Only ProductDetailPage imports these, so
                // they stay in a lazy chunk nobody downloads unless they open a
                // product page.
                name: 'vendor-markdown',
                test: MARKDOWN_MODULES,
                priority: 30,
              },
              {
                name: 'vendor-supabase',
                test: /[\\/]node_modules[\\/]@supabase[\\/]/,
                priority: 20,
              },
              {
                name: 'vendor-icons',
                test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
                priority: 10,
              },
              {
                // Everything else in node_modules.
                name: 'vendor',
                test: /[\\/]node_modules[\\/]/,
                priority: 0,
              },
            ],
          },
        },
      },
    },
  };
});
