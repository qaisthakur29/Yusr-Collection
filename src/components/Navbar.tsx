import React, { useState } from 'react';
import { Menu, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalCount, openCart } = useCart();

  const navLinks = [
    { label: 'HOME', path: '/' },
    { label: 'SHOP', path: '/shop' },
    { label: 'TRACK ORDER', path: '/track-order' },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-[#1A1A1A] text-white py-2 px-4 text-center font-announcement border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[11px] sm:text-xs">
          <span>FREE PAN-INDIA DELIVERY ON PREPAID ORDERS</span>
          <span className="opacity-40" aria-hidden="true">·</span>
          <span className="text-[#C2A77A] font-bold">₹50 OFF WITH CODE: PREPAID50</span>
        </div>
      </div>

      {/* Sticky Main Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Left Zone: Hamburger (mobile) or Navigation Links (desktop) */}
          <div className="flex items-center min-w-[120px] md:min-w-[200px]">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-[#1A1A1A] hover:text-[#C2A77A] transition-colors -ml-2"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Desktop Navigation Links: SHOP and TRACK ORDER */}
            <nav className="hidden md:flex items-center gap-8 font-nav">
              {navLinks.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <a
                    key={link.path}
                    href={link.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.path);
                    }}
                    className={`relative py-2 text-sm tracking-[0.1em] uppercase transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-[#1A1A1A] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#C2A77A]'
                        : 'text-[#666666] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Center Zone: Yusr Logo */}
          <div className="flex-1 flex justify-center items-center">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('/');
              }}
              className="flex items-center py-2 shrink-0 group focus:outline-none"
              aria-label="Yusr Collection Home"
            >
              <img
                src="/assets/aistudio/YUSR_COLLECTION_REMOVED_BG_LOGO_82f5c6c0.png"
                alt="Yusr Collection"
                className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                referrerPolicy="no-referrer"
              />
            </a>
          </div>

          {/* Right Zone: Cart Icon with Bag Counter Badge */}
          <div className="flex items-center justify-end min-w-[120px] md:min-w-[200px]">
            <button
              onClick={openCart}
              className="min-h-[44px] min-w-[44px] px-2 py-2 flex items-center gap-2 text-[#1A1A1A] hover:text-[#C2A77A] transition-colors relative"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline font-heading font-semibold text-xs tracking-wide">
                BAG
              </span>
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-[#C2A77A] text-[#111111] font-heading font-bold text-[11px] rounded-full">
                {totalCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Strictly ONLY SHOP & TRACK ORDER) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden overflow-hidden">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-[85vw] max-w-xs bg-white text-[#1A1A1A] shadow-2xl flex flex-col justify-between">
              <div>
                {/* Mobile Drawer Header */}
                <div className="px-6 py-5 border-b border-[#E5E5E5] flex items-center justify-between">
                  <img
                    src="/assets/aistudio/YUSR_COLLECTION_REMOVED_BG_LOGO_82f5c6c0.png"
                    alt="Yusr Collection"
                    className="h-8 w-auto object-contain"
                  />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#666666] hover:text-[#1A1A1A] -mr-2"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Mobile Navigation List with only SHOP and TRACK ORDER */}
                <div className="px-4 py-6 space-y-2">
                  {navLinks.map((link) => {
                    const isActive = currentPath === link.path;
                    return (
                      <button
                        key={link.path}
                        onClick={() => handleNavClick(link.path)}
                        className={`w-full min-h-[48px] px-4 flex items-center justify-between font-heading font-medium text-sm tracking-[0.1em] uppercase text-left transition-colors ${
                          isActive
                            ? 'bg-[#F7F4EE] text-[#1A1A1A] font-bold border-l-2 border-[#C2A77A]'
                            : 'text-[#1A1A1A] hover:bg-neutral-50'
                        }`}
                      >
                        <span>{link.label}</span>
                        <ArrowRight className="w-4 h-4 text-[#C2A77A]" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Drawer Bottom */}
              <div className="p-6 bg-[#F9F9F9] border-t border-[#E5E5E5] space-y-3">
                <a
                  href="https://wa.me/919326184407"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] py-3 bg-[#25D366] text-white flex items-center justify-center gap-2 font-heading font-bold text-xs uppercase tracking-wide"
                >
                  WhatsApp Support (+91 9326184407)
                </a>
                <p className="text-[11px] text-[#666666] text-center font-body">
                  Rooted in Faith. Built on Struggles.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
