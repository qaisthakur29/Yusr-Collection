import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import { Product, fetchProductsFromDB } from '../data/products';
import { useCart } from '../context/CartContext';
import { optimizeImage } from '../lib/image';
import { ProductCardImage } from '../components/ProductCardImage';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectProduct: (product: Product) => void;
}

export function HomePage({ onNavigate, onSelectProduct }: HomePageProps) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuickSize, setSelectedQuickSize] = useState<Record<string, 'S' | 'M' | 'L' | 'XL' | 'XXL'>>({});
  const [addedBanner, setAddedBanner] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProductsFromDB().then((data) => {
      if (cancelled) return;
      setProducts(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const size = selectedQuickSize[product.id] || 'L';
    addToCart(product, size, 1);
    setAddedBanner(`Added ${product.name} (Size ${size})`);
    setTimeout(() => setAddedBanner(null), 2500);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      {/* Toast Notification */}
      {addedBanner && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1A1A] text-white px-4 py-3 shadow-xl flex items-center gap-3 text-xs font-heading font-semibold border-l-4 border-[#C2A77A] animate-fade-in">
          <Check className="w-4 h-4 text-[#C2A77A]" />
          <span>{addedBanner}</span>
        </div>
      )}

      {/* 1. HERO SECTION BANNER */}
      {/* Anchored with object-top and responsive height (h-[60vh] md:h-[80vh]) to prevent top logo cropping */}
      <section className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] min-h-[420px] max-h-[850px] bg-[#121212] overflow-hidden flex flex-col justify-end">
        {/* Full Banner Image with object-top guarantee */}
        <img
          src={optimizeImage('/assets/aistudio/HERO_SECTION_BANNER_83e65a6d.png', 1600)}
          alt="Yusr Collection"
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover object-top select-none pointer-events-none"
          referrerPolicy="no-referrer"
        />

        {/* Subtle bottom gradient to gracefully elevate the CTA button without cutting artwork */}
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

        {/* ONLY KEEP THE SHOP NOW BUTTON - Beautifully centered */}
        <div className="relative z-10 w-full pb-10 sm:pb-12 md:pb-16 flex justify-center px-4">
          <button
            onClick={() => onNavigate('/shop')}
            className="min-h-[48px] px-10 sm:px-14 py-3.5 sm:py-4 bg-[#C2A77A] hover:bg-[#B39665] text-[#111111] font-heading font-bold text-sm tracking-[0.08em] uppercase transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.99]"
          >
            <span>SHOP NOW</span>
            <ArrowRight className="w-4 h-4 text-[#111111]" />
          </button>
        </div>
      </section>

      {/* 2. VALUE PROPOSITIONS BAR - Clean, global apparel copy */}
      <section className="bg-[#F8F8F8] border-b border-[#E5E5E5] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-2">
              <span className="block font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                Premium Streetwear
              </span>
              <span className="text-[11px] text-[#666666]">Crafted for the believers</span>
            </div>
            <div className="p-2">
              <span className="block font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                Architectural Fit
              </span>
              <span className="text-[11px] text-[#666666]">Modest drop-shoulder drape</span>
            </div>
            <div className="p-2">
              <span className="block font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                Made-To-Order
              </span>
              <span className="text-[11px] text-[#666666]">Custom crafted for you</span>
            </div>
            <div className="p-2">
              <span className="block font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                Free India Shipping
              </span>
              <span className="text-[11px] text-[#666666]">On all prepaid orders</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED COLLECTION SECTION (2 cols mobile, 4 cols desktop) */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-[#E5E5E5] gap-4">
          <div>
            <span className="text-xs font-heading font-bold tracking-[0.1em] uppercase text-[#C2A77A] block mb-1">
              CURATED DROPS
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl uppercase tracking-tight text-[#1A1A1A]">
              FEATURED COLLECTION
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/shop')}
            className="text-xs font-heading font-bold tracking-wider uppercase text-[#1A1A1A] hover:text-[#C2A77A] flex items-center gap-1.5 min-h-[44px]"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Product Grid: 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {loading ? (
            <p className="col-span-2 md:col-span-4 text-sm text-[#666666] font-body">Loading...</p>
          ) : null}
          {(loading ? [] : products).map((product) => {
            const activeSize = selectedQuickSize[product.id] || 'L';
            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group flex flex-col cursor-pointer bg-white"
              >
                <ProductCardImage product={product}>
                  {product.badge && (
                    <div className="absolute top-2.5 left-2.5 bg-[#1A1A1A] text-white px-2 py-0.5 text-[10px] font-heading font-bold uppercase tracking-wider">
                      {product.badge}
                    </div>
                  )}
                  <div className="absolute inset-x-2 bottom-2 hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => handleQuickAdd(product, e)}
                      className="w-full min-h-[40px] py-2 bg-[#C2A77A] hover:bg-[#B39665] text-[#111111] font-heading font-bold text-xs uppercase tracking-wide transition-colors shadow-md"
                    >
                      Quick Add ({activeSize})
                    </button>
                  </div>
                </ProductCardImage>

                {/* Product Metadata */}
                <div className="pt-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-heading uppercase text-[#666666] tracking-wider block">
                      {product.tag || product.category}
                    </span>
                    <h3 className="font-heading font-semibold text-sm sm:text-base text-[#1A1A1A] uppercase tracking-[0.02em] mt-0.5 group-hover:text-[#C2A77A] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </div>

                  {/* Size Pill Selector for Mobile & Desktop */}
                  <div
                    className="flex items-center gap-1 my-2 overflow-x-auto pb-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setSelectedQuickSize((prev) => ({ ...prev, [product.id]: s }))
                        }
                        className={`min-w-[28px] h-7 px-1.5 text-[11px] font-heading font-semibold transition-colors border ${
                          activeSize === s
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                            : 'bg-white text-[#666666] border-[#E5E5E5] hover:border-[#1A1A1A]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Price Row */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading font-bold text-base sm:text-lg text-[#1A1A1A] tabular-nums">
                        ₹{product.price}
                      </span>
                      <span className="font-body text-xs text-[#666666] line-through tabular-nums">
                        ₹{product.mrp}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold uppercase">
                      Save ₹{product.mrp - product.price}
                    </span>
                  </div>

                  {/* Mobile Quick Add Button (min 44px) */}
                  <button
                    onClick={(e) => handleQuickAdd(product, e)}
                    className="md:hidden mt-3 w-full min-h-[44px] py-2.5 bg-[#C2A77A] text-[#111111] font-heading font-bold text-xs uppercase tracking-wide"
                  >
                    Add to Bag ({activeSize})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. BRAND MISSION STRIP */}
      <section className="bg-[#1A1A1A] text-white py-16 md:py-24 border-y border-[#262626] relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="text-xs font-heading font-bold tracking-[0.2em] uppercase text-[#C2A77A] block mb-3">
            OUR PHILOSOPHY
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight mb-6 leading-tight">
            "ROOTED IN FAITH. <br />
            BUILT ON STRUGGLES."
          </h2>
          <p className="font-body text-neutral-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Streetwear culture became loud and vulgar. There was a void for clothing that felt aggressive and premium on the streets, yet stayed completely grounded in Islamic modesty. We fill that void.
          </p>
          <button
            onClick={() => onNavigate('/about')}
            className="min-h-[48px] px-8 py-3.5 bg-transparent border-2 border-[#C2A77A] text-[#C2A77A] hover:bg-[#C2A77A] hover:text-[#111111] font-heading font-bold text-xs sm:text-sm uppercase tracking-[0.05em] transition-all"
          >
            READ THE FOUNDER'S STORY
          </button>
        </div>
      </section>

    </div>
  );
}
