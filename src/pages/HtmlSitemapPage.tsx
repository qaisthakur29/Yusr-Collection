import React from 'react';
import { Product } from '../data/products';
import { PUBLIC_ROUTES } from '../lib/seo';

interface HtmlSitemapPageProps {
  products: Product[];
  productsReady: boolean;
  onNavigate: (path: string) => void;
  onSelectProduct: (product: Product) => void;
}

/**
 * Human-facing index of every page on the site.
 *
 * Unlike the XML sitemap this is a real page, so the links are genuine <a href>
 * elements (lets crawlers follow them) with the click intercepted so navigation
 * stays client-side.
 */
export function HtmlSitemapPage({
  products,
  productsReady,
  onNavigate,
  onSelectProduct,
}: HtmlSitemapPageProps) {
  const linkClick = (event: React.MouseEvent, action: () => void) => {
    event.preventDefault();
    action();
  };

  // Group by category so the list stays readable as the catalogue grows.
  const byCategory = products.reduce<Record<string, Product[]>>((groups, product) => {
    const key = product.category?.trim() || 'Other';
    (groups[key] ??= []).push(product);
    return groups;
  }, {});
  const categories = Object.keys(byCategory).sort((a, b) => a.localeCompare(b));

  return (
    <div className="bg-white min-h-[100dvh] py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="border-b border-[#E5E5E5] pb-6 mb-8 text-center sm:text-left">
          <div className="text-xs font-heading font-bold uppercase tracking-[0.15em] text-[#C2A77A] mb-1">
            ALL PAGES
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[#1A1A1A]">
            SITE MAP
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] font-body mt-1">
            Every page on YUSR COLLECTION in one place.
          </p>
        </div>

        {/* Static pages */}
        <section className="mb-12">
          <h2 className="font-heading font-bold text-xs uppercase tracking-[0.15em] text-[#1A1A1A] mb-4">
            Main Pages
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 border border-[#E5E5E5] p-5">
            {PUBLIC_ROUTES.map((route) => (
              <li key={route.path}>
                <a
                  href={route.path}
                  onClick={(e) => linkClick(e, () => onNavigate(route.path))}
                  className="block py-1.5 text-sm font-body text-[#666666] hover:text-[#1A1A1A] hover:underline transition-colors"
                >
                  {route.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Products */}
        <section>
          <h2 className="font-heading font-bold text-xs uppercase tracking-[0.15em] text-[#1A1A1A] mb-4">
            Products
          </h2>

          {!productsReady && (
            <p className="text-sm text-[#666666] font-body border border-[#E5E5E5] p-5">
              Loading products…
            </p>
          )}

          {productsReady && products.length === 0 && (
            <p className="text-sm text-[#666666] font-body border border-[#E5E5E5] p-5">
              No products are published yet.
            </p>
          )}

          {productsReady &&
            categories.map((category) => (
              <div key={category} className="mb-8">
                <h3 className="font-heading font-bold text-[11px] uppercase tracking-[0.15em] text-[#C2A77A] mb-3">
                  {category}
                </h3>
                <ul className="border border-[#E5E5E5] divide-y divide-[#E5E5E5]">
                  {byCategory[category].map((product) => (
                    <li key={product.id}>
                      <a
                        href={`/product/${product.slug}`}
                        onClick={(e) => linkClick(e, () => onSelectProduct(product))}
                        className="flex items-center justify-between gap-4 px-5 py-3 text-sm font-body text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FAF9F6] transition-colors"
                      >
                        <span className="font-heading font-semibold uppercase tracking-wide text-[#1A1A1A]">
                          {product.name}
                        </span>
                        <span className="tabular-nums shrink-0">₹{product.price}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </section>
      </div>
    </div>
  );
}
