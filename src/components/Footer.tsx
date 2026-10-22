import React from 'react';
import { Mail, MessageCircle, ArrowUpRight, ShieldCheck, RefreshCw, Truck } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const handleLinkClick = (path: string) => {
    onNavigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#FFFFFF] text-[#1A1A1A] border-t border-[#E5E5E5] pt-14 pb-12 font-body">
      {/* 3 Minimalist Trust Highlights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-[#E5E5E5]">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 bg-[#F7F4EE] flex items-center justify-center shrink-0 text-[#C2A77A]">
              <ShieldCheck className="w-4 h-4 text-[#C2A77A]" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-wide text-[#1A1A1A]">
                Premium Fabrics
              </h4>
              <p className="text-xs text-[#666666] mt-0.5 leading-relaxed">
                Super-combed cotton & heavyweight fleece with architectural boxy silhouettes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 bg-[#F7F4EE] flex items-center justify-center shrink-0 text-[#C2A77A]">
              <Truck className="w-4 h-4 text-[#C2A77A]" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-wide text-[#1A1A1A]">
                Made-to-Order Ethics
              </h4>
              <p className="text-xs text-[#666666] mt-0.5 leading-relaxed">
                Custom crafted to eliminate waste. Dispatched pan-India with live SMS & WhatsApp tracking.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 bg-[#F7F4EE] flex items-center justify-center shrink-0 text-[#C2A77A]">
              <RefreshCw className="w-4 h-4 text-[#C2A77A]" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-wide text-[#1A1A1A]">
                Size Exchange Guaranteed
              </h4>
              <p className="text-xs text-[#666666] mt-0.5 leading-relaxed">
                One-time size exchange within 48 hours of delivery. Free replacement on defects with unboxing video.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12">
          
          {/* Brand Intro Column */}
          <div className="md:col-span-4 space-y-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('/');
              }}
              className="inline-block"
            >
              <img
                src="/assets/aistudio/YUSR_COLLECTION_REMOVED_BG_LOGO_82f5c6c0.png"
                alt="Yusr Collection"
                className="h-10 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </a>
            <p className="text-sm text-[#666666] max-w-sm leading-relaxed">
              Yusr means "Ease". We craft modest, high-end streetwear for believers, gym bros, and fighters who carry their legacy with pride.
            </p>
            <div className="pt-1 text-xs text-[#1A1A1A]">
              <span className="text-[#C2A77A] font-bold">Rooted in Faith.</span> Built on Struggles.
            </div>
          </div>

          {/* Section 1: Shop */}
          <div className="md:col-span-2 space-y-3">
            <div className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
              Shop
            </div>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <button
                  onClick={() => handleLinkClick('/shop')}
                  className="text-[#666666] hover:text-[#1A1A1A] transition-colors py-1 text-left"
                >
                  Shop
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('/track-order')}
                  className="text-[#666666] hover:text-[#1A1A1A] transition-colors py-1 text-left"
                >
                  Track Order
                </button>
              </li>
            </ul>
          </div>

          {/* Section 2: Information */}
          <div className="md:col-span-3 space-y-3">
            <div className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
              Information
            </div>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <button
                  onClick={() => handleLinkClick('/about')}
                  className="text-[#666666] hover:text-[#1A1A1A] transition-colors py-1 text-left"
                >
                  Our Story
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('/faq')}
                  className="text-[#666666] hover:text-[#1A1A1A] transition-colors py-1 text-left"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('/contact')}
                  className="text-[#666666] hover:text-[#1A1A1A] transition-colors py-1 text-left"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('/returns')}
                  className="text-[#666666] hover:text-[#1A1A1A] transition-colors py-1 text-left"
                >
                  Returns & Exchange
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('/policy')}
                  className="text-[#666666] hover:text-[#1A1A1A] transition-colors py-1 text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('/terms')}
                  className="text-[#666666] hover:text-[#1A1A1A] transition-colors py-1 text-left"
                >
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* Section 3: Contact */}
          <div className="md:col-span-3 space-y-3">
            <div className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
              Contact
            </div>
            <p className="text-xs text-[#666666] leading-relaxed">
              We operate digitally across India. Need help with an order, sizing, or exchange?
            </p>
            <div className="space-y-2 pt-1">
              <a
                href="https://wa.me/919326184407"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm font-medium text-[#1A1A1A] hover:text-[#25D366] transition-colors py-1"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>WhatsApp: +91 9326184407</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
              </a>
              <a
                href="mailto:yusrrcollections@gmail.com"
                className="flex items-center gap-2.5 text-sm font-medium text-[#1A1A1A] hover:text-[#C2A77A] transition-colors py-1"
              >
                <Mail className="w-4 h-4 text-[#C2A77A]" />
                <span className="truncate">yusrrcollections@gmail.com</span>
              </a>
            </div>
            <p className="text-[11px] text-[#888888] pt-2">
              (No physical walk-in store. Centralized dispatch via fulfillment partners).
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#666666]">
          <p>© {new Date().getFullYear()} YUSR COLLECTION. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span>Made with Tawakkul</span>
            <span aria-hidden="true">·</span>
            <span>Wear Your Ease</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
