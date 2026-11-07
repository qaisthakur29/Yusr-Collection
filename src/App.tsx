import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { Product, fetchProductBySlug, fetchProductsFromDB } from './data/products';
import { trackPageView } from './lib/metaPixel';
import { applyNotFoundSeo, applyProductSeo, applyStaticSeo, isKnownRoute } from './lib/seo';

declare global {
  interface Window {
    /** GA4 command queue. The inline snippet in index.html defines it synchronously. */
    gtag?: (...args: unknown[]) => void;
  }
}

// Only the landing page is part of the initial bundle; every other route is
// downloaded on demand so the first paint stays fast.
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })),
);
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ReturnsPage = lazy(() =>
  import('./pages/ReturnsPage').then((m) => ({ default: m.ReturnsPage })),
);
const FaqPage = lazy(() => import('./pages/FaqPage').then((m) => ({ default: m.FaqPage })));
const PrivacyPolicyPage = lazy(() =>
  import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })),
);
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const TrackOrderPage = lazy(() =>
  import('./pages/TrackOrderPage').then((m) => ({ default: m.TrackOrderPage })),
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })),
);
const HtmlSitemapPage = lazy(() =>
  import('./pages/HtmlSitemapPage').then((m) => ({ default: m.HtmlSitemapPage })),
);
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function productSlugFromPath(path: string): string | null {
  if (!path.startsWith('/product/')) return null;
  const slug = decodeURIComponent(path.slice('/product/'.length).split('/')[0] || '').trim();
  return slug || null;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      return p && p !== '' ? p : '/';
    }
    return '/';
  });

  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productStatus, setProductStatus] = useState<'idle' | 'loading' | 'missing'>('idle');

  // The Meta Pixel base code in index.html already fires PageView for the initial
  // load, and GA4's gtag('config') there sends the matching initial page_view, so
  // skip the first run of this effect and only track SPA route changes after it.
  const hasTrackedInitialPageView = useRef(false);
  useEffect(() => {
    if (!hasTrackedInitialPageView.current) {
      hasTrackedInitialPageView.current = true;
      return;
    }
    trackPageView();
    // No ready-check needed: index.html declares gtag() inline, so it exists here
    // even when gtag.js is still downloading or was blocked — calls just queue on
    // dataLayer. The optional call covers the snippet being stripped entirely.
    window.gtag?.('event', 'page_view', { page_path: currentPath });
  }, [currentPath]);

  useEffect(() => {
    let cancelled = false;
    fetchProductsFromDB().then((products) => {
      if (cancelled) return;
      setCatalog(products);
      setCatalogReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const slug = productSlugFromPath(currentPath);
    if (!slug) {
      setSelectedProduct(null);
      setProductStatus('idle');
      return;
    }

    const fromCatalog = catalog.find((p) => p.slug === slug);
    if (fromCatalog) {
      setSelectedProduct(fromCatalog);
      setProductStatus('idle');
      return;
    }

    if (selectedProduct?.slug === slug) {
      setProductStatus('idle');
      return;
    }

    let cancelled = false;
    setProductStatus('loading');
    fetchProductBySlug(slug).then((product) => {
      if (cancelled) return;
      if (product) {
        setSelectedProduct(product);
        setProductStatus('idle');
        return;
      }
      setSelectedProduct(null);
      setProductStatus(catalogReady ? 'missing' : 'loading');
    });

    return () => {
      cancelled = true;
    };
  }, [currentPath, catalog, catalogReady]);

  // Rewrite <title>, meta description, canonical and Open Graph tags for the
  // current route. Kept in one effect so <head> always reflects the final state
  // rather than racing with a second writer elsewhere.
  useEffect(() => {
    if (currentPath.startsWith('/product/')) {
      // Only apply once the product for this exact URL has resolved, otherwise a
      // product page would briefly canonicalise to the homepage.
      const slug = productSlugFromPath(currentPath);
      if (selectedProduct && slug && selectedProduct.slug === slug) {
        applyProductSeo(selectedProduct);
      } else if (productStatus === 'missing') {
        // Dead product URL: mark it noindex so Google drops it instead of
        // indexing a 200 page that only says "not found".
        applyNotFoundSeo();
      }
      return;
    }
    if (!isKnownRoute(currentPath)) {
      applyNotFoundSeo();
      return;
    }
    applyStaticSeo(currentPath);
  }, [currentPath, selectedProduct, productStatus]);

  // Handle browser popstate (back / forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);

    try {
      window.history.pushState({}, '', path);
    } catch {}

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductStatus('idle');
    const path = `/product/${product.slug}`;
    setCurrentPath(path);
    try {
      window.history.pushState({}, '', path);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentView = () => {
    if (currentPath.startsWith('/product/')) {
      if (selectedProduct) {
        return (
          <ProductDetailPage
            key={selectedProduct.slug}
            product={selectedProduct}
            onNavigate={navigateTo}
          />
        );
      }

      if (productStatus === 'missing') {
        return <NotFoundPage onNavigate={navigateTo} />;
      }

      return (
        <div className="min-h-[40vh] flex items-center justify-center">
          <p className="text-sm text-[#666666] font-body">Loading...</p>
        </div>
      );
    }

    switch (currentPath) {
      case '/shop':
        return <ShopPage onSelectProduct={handleSelectProduct} onNavigate={navigateTo} />;
      case '/about':
        return <AboutPage onNavigate={navigateTo} />;
      case '/returns':
        return <ReturnsPage />;
      case '/faq':
        return <FaqPage />;
      case '/policy':
        return <PrivacyPolicyPage />;
      case '/terms':
        return <TermsPage />;
      case '/track-order':
        return <TrackOrderPage />;
      case '/contact':
        return <ContactPage />;
      case '/html-sitemap':
        return (
          <HtmlSitemapPage
            products={catalog}
            productsReady={catalogReady}
            onNavigate={navigateTo}
            onSelectProduct={handleSelectProduct}
          />
        );
      // Obfuscated on purpose: a guessable /admin invites probing. Change this
      // value and the matching robots.txt disallow together.
      case '/yusr-manage-9821':
        return <AdminPage />;
      case '/':
        return <HomePage onNavigate={navigateTo} onSelectProduct={handleSelectProduct} />;
      default:
        return <NotFoundPage onNavigate={navigateTo} />;
    }
  };

  return (
    <CartProvider>
      <div className="min-h-[100dvh] flex flex-col bg-white text-[#1A1A1A] overflow-x-hidden">
        {/* Global Navigation */}
        <Navbar currentPath={currentPath} onNavigate={navigateTo} />

        {/* Dynamic Page Outlet */}
        <main className="flex-1">
          <Suspense
            fallback={
              <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
                <div
                  className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#C2A77A] rounded-full animate-spin"
                  role="status"
                  aria-label="Loading"
                />
                <p className="text-sm text-[#666666] font-body">Loading...</p>
              </div>
            }
          >
            {renderCurrentView()}
          </Suspense>
        </main>

        {/* Global Slide-Over Cart Drawer */}
        <CartDrawer />

        {/* Global Minimalist Footer */}
        <Footer onNavigate={navigateTo} />
      </div>
    </CartProvider>
  );
}
