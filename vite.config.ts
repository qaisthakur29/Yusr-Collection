import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import sitemap from 'vite-plugin-sitemap';

// Canonical production origin. Every <loc> in sitemap.xml is built from this, so
// it must be the domain search engines will index.
const SITE_URL = 'https://yusrcollection.store';

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

// Product slugs live in Supabase, so they cannot be discovered from the bundle.
// Read them at build time from the public REST endpoint using the same anon key
// the storefront already ships with. A failure here is logged rather than thrown
// so a network hiccup can never break the deploy — the sitemap still gets the
// static routes.
async function fetchProductRoutes(supabaseUrl?: string, anonKey?: string): Promise<string[]> {
  if (!supabaseUrl || !anonKey) {
    console.warn(
      '[sitemap] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — skipping product routes.',
    );
    return [];
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/products?select=slug`, {
      headers: {apikey: anonKey, Authorization: `Bearer ${anonKey}`},
    });

    if (!res.ok) {
      console.warn(`[sitemap] product slug request failed with ${res.status} — skipping product routes.`);
      return [];
    }

    const rows = (await res.json()) as {slug: string | null}[];
    const routes = rows
      .map((row) => row.slug)
      .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
      .map((slug) => `/product/${slug}`);

    console.log(`[sitemap] added ${routes.length} product route(s).`);
    return routes;
  } catch (err) {
    console.warn('[sitemap] could not reach Supabase — skipping product routes.', err);
    return [];
  }
}

// Every package that `react-markdown` pulls in. Kept as one pattern so the whole
// dependency tree is classified as a unit rather than drifting between chunks as
// transitive versions change.
const MARKDOWN_MODULES =
  /[\\/]node_modules[\\/](?:react-markdown|@ungap|remark-parse|remark-rehype|unified|bail|trough|zwitch|vfile(?:-message)?|devlop|dequal|ccount|longest-streak|trim-lines|parse-entities|stringify-entities|character-entities(?:-html4|-legacy)?|character-reference-invalid|decode-named-character-reference|property-information|space-separated-tokens|comma-separated-tokens|style-to-object|inline-style-parser|html-url-attributes|estree-util-is-identifier-name|is-alphabetical|is-alphanumerical|is-decimal|is-hexadecimal|is-plain-obj|micromark[a-z-]*|mdast-util[a-z-]*|hast-util[a-z-]*|unist-util[a-z-]*)[\\/]/;

export default defineConfig(async ({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const productRoutes = await fetchProductRoutes(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

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
