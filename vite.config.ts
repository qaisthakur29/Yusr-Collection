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
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            return 'vendor';
          },
        },
      },
    },
  };
});
