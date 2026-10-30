import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Product,
  ProductSort,
  fetchProductsFromDB,
  fetchProductsCount,
  fetchProductCategories,
} from '../data/products';
import { useCart } from '../context/CartContext';
import { ProductCardImage } from '../components/ProductCardImage';

const PAGE_SIZE = 8;

interface ShopPageProps {
  onSelectProduct: (product: Product) => void;
  onNavigate: (path: string) => void;
}

export function ShopPage({ onSelectProduct }: ShopPageProps) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<ProductSort>('featured');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, 'S' | 'M' | 'L' | 'XL' | 'XXL'>>({});

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Categories only need to be fetched once.
  useEffect(() => {
    let cancelled = false;
    fetchProductCategories().then((data) => {
      if (!cancelled) setCategories(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Changing the filter or sort starts a new result set, so go back to page 1.
  useEffect(() => {
    setPage(0);
  }, [selectedCategory, sortBy]);

  // Fetch only the current page of products, plus the matching total for the pager.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchProductsFromDB({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        category: selectedCategory,
        sort: sortBy,
      }),
      fetchProductsCount(selectedCategory),
    ]).then(([items, count]) => {
      if (cancelled) return;
      setProducts(items);
      setTotalCount(count);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, sortBy, page]);

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
            Showing <span className="font-bold text-[#1A1A1A]">{products.length}</span> of{' '}
            <span className="font-bold text-[#1A1A1A]">{totalCount}</span> pieces
          </div>
        </div>

        {/* Filters and Sorting Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 bg-[#FBFBFB] p-3 border border-[#E5E5E5]">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['All', ...categories].map((cat) => (
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
              onChange={(e) => setSortBy(e.target.value as ProductSort)}
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
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex flex-col" aria-hidden="true">
                  <div className="w-full aspect-[4/5] bg-[#F0F0F0] animate-pulse" />
                  <div className="pt-3 space-y-2">
                    <div className="h-3 w-1/3 bg-[#F0F0F0] animate-pulse" />
                    <div className="h-4 w-3/4 bg-[#F0F0F0] animate-pulse" />
                    <div className="h-5 w-1/2 bg-[#F0F0F0] animate-pulse" />
                  </div>
                </div>
              ))
            : products.map((product) => {
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

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <p className="text-center text-sm text-[#666666] font-body py-16">
            No pieces found in this collection.
          </p>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center border border-[#E5E5E5] bg-white text-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#1A1A1A] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-current={page === i ? 'page' : undefined}
                className={`min-h-[40px] min-w-[40px] px-3 text-xs font-heading font-semibold tabular-nums transition-colors ${
                  page === i
                    ? 'bg-[#1A1A1A] text-white'
                    : 'bg-white text-[#666666] border border-[#E5E5E5] hover:text-[#1A1A1A]'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center border border-[#E5E5E5] bg-white text-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#1A1A1A] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
