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
import { Product, PRODUCTS } from './data/products';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      return p && p !== '' ? p : '/';
    }
    return '/';
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/product/')) {
        const slug = path.replace('/product/', '');
        return PRODUCTS.find((p) => p.slug === slug) || null;
      }
    }
    return null;
  });

  // Handle browser popstate (back / forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentPath(path);
      if (path.startsWith('/product/')) {
        const slug = path.replace('/product/', '');
        const matched = PRODUCTS.find((p) => p.slug === slug);
        setSelectedProduct(matched || null);
      } else {
        setSelectedProduct(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    if (path.startsWith('/product/')) {
      const slug = path.replace('/product/', '');
      const matched = PRODUCTS.find((p) => p.slug === slug);
      setSelectedProduct(matched || null);
    } else {
      setSelectedProduct(null);
    }

    try {
      window.history.pushState({}, '', path);
    } catch {}

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    const path = `/product/${product.slug}`;
    setCurrentPath(path);
    try {
      window.history.pushState({}, '', path);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentView = () => {
    // If a product is selected or path starts with /product/
    if (selectedProduct || currentPath.startsWith('/product/')) {
      const targetProduct =
        selectedProduct ||
        PRODUCTS.find((p) => p.slug === currentPath.replace('/product/', '')) ||
        PRODUCTS[0];

      return (
        <ProductDetailPage
          product={targetProduct}
          onNavigate={navigateTo}
          onBack={() => navigateTo('/shop')}
        />
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
