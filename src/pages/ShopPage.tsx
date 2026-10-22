import React, { useEffect, useState } from 'react';
import { Product, fetchProductsFromDB } from '../data/products';
import { useCart } from '../context/CartContext';
import { ProductCardImage } from '../components/ProductCardImage';

interface ShopPageProps {
  onSelectProduct: (product: Product) => void;
  onNavigate: (path: string) => void;
}

export function ShopPage({ onSelectProduct, onNavigate }: ShopPageProps) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, 'S' | 'M' | 'L' | 'XL' | 'XXL'>>({});

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

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0;
  });

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const size = selectedSizes[product.id] || 'L';
    addToCart(product, size, 1);
  };

  return (
    <div className="bg-white min-h-[100dvh] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="border-b border-[#E5E5E5] pb-6 mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="text-xs font-heading font-bold uppercase tracking-[0.15em] text-[#C2A77A] mb-1">
              ALL DROPS
            </div>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#1A1A1A]">
              THE YUSR CATALOG
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] mt-1 font-body">
              Heavyweight 240 GSM modest streetwear crafted without compromise.
            </p>
          </div>

          <div className="text-xs text-[#666666] font-heading font-medium">
            Showing <span className="font-bold text-[#1A1A1A]">{filteredProducts.length}</span> pieces
          </div>
        </div>

        {/* Filters and Sorting Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 bg-[#FBFBFB] p-3 border border-[#E5E5E5]">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[40px] px-4 py-2 text-xs font-heading font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#1A1A1A] text-white shadow-xs'
                    : 'bg-white text-[#666666] border border-[#E5E5E5] hover:text-[#1A1A1A]'
                }`}
              >
                {cat === 'All' ? 'All Pieces' : cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-[#666666] font-heading uppercase hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="min-h-[40px] px-3 py-1.5 border border-[#E5E5E5] bg-white text-xs font-heading font-semibold uppercase text-[#1A1A1A] focus:outline-none focus:border-[#C2A77A]"
            >
              <option value="featured">Featured Drop</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid: 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {loading ? (
            <p className="col-span-2 md:col-span-4 text-sm text-[#666666] font-body">Loading...</p>
          ) : null}
          {(loading ? [] : filteredProducts).map((product) => {
            const currentSize = selectedSizes[product.id] || 'L';
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
                      className="w-full min-h-[40px] py-2 bg-[#C2A77A] hover:bg-[#B39665] text-[#111111] font-heading font-bold text-xs uppercase tracking-wide transition-colors shadow-sm"
                    >
                      Quick Add ({currentSize})
                    </button>
                  </div>
                </ProductCardImage>

                {/* Details */}
                <div className="pt-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-heading uppercase text-[#666666] tracking-wider block">
                      {product.tag || product.category}
                    </span>
                    <h2 className="font-heading font-semibold text-sm sm:text-base text-[#1A1A1A] uppercase tracking-[0.02em] mt-0.5 group-hover:text-[#C2A77A] transition-colors line-clamp-1">
                      {product.name}
                    </h2>
                  </div>

                  {/* Size Selector */}
                  <div
                    className="flex items-center gap-1 my-2 overflow-x-auto pb-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setSelectedSizes((prev) => ({ ...prev, [product.id]: s }))
                        }
                        className={`min-w-[28px] h-7 px-1.5 text-[11px] font-heading font-semibold transition-colors border ${
                          currentSize === s
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                            : 'bg-white text-[#666666] border-[#E5E5E5] hover:border-[#1A1A1A]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Price */}
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

                  {/* Mobile Add to Bag Button */}
                  <button
                    onClick={(e) => handleQuickAdd(product, e)}
                    className="md:hidden mt-3 w-full min-h-[44px] py-2.5 bg-[#C2A77A] text-[#111111] font-heading font-bold text-xs uppercase tracking-wide"
                  >
                    Add to Bag ({currentSize})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
