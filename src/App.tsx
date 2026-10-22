import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { FaqPage } from './pages/FaqPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPage } from './pages/AdminPage';
import { Product, fetchProductBySlug, fetchProductsFromDB } from './data/products';

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
            onBack={() => navigateTo('/shop')}
          />
        );
      }

      if (productStatus === 'missing') {
        return (
          <div className="min-h-[40vh] flex items-center justify-center">
            <p className="text-sm text-[#666666] font-body">Product not found.</p>
          </div>
        );
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
      case '/admin':
        return <AdminPage />;
      case '/':
      default:
        return <HomePage onNavigate={navigateTo} onSelectProduct={handleSelectProduct} />;
    }
  };

  return (
    <CartProvider>
      <div className="min-h-[100dvh] flex flex-col bg-white text-[#1A1A1A] overflow-x-hidden">
        {/* Global Navigation */}
        <Navbar currentPath={currentPath} onNavigate={navigateTo} />

        {/* Dynamic Page Outlet */}
        <main className="flex-1">{renderCurrentView()}</main>

        {/* Global Slide-Over Cart Drawer */}
        <CartDrawer />

        {/* Global Minimalist Footer */}
        <Footer onNavigate={navigateTo} />
      </div>
    </CartProvider>
  );
}
