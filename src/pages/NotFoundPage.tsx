import React from 'react';
import { SearchX } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
}

/**
 * Rendered for any URL the router does not recognise, and for product slugs that
 * do not exist. The route is a client-rendered SPA page, so the response is still
 * a 200; src/lib/seo.ts pairs this view with a `noindex` directive to keep the
 * soft 404 out of search results.
 */
export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="bg-white min-h-[60dvh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center border border-[#E5E5E5] bg-white p-8 sm:p-10">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#F7F4EE] flex items-center justify-center">
          <SearchX className="w-6 h-6 text-[#C2A77A]" />
        </div>
        <div className="text-xs font-heading font-bold uppercase tracking-[0.15em] text-[#C2A77A] mb-1">
          404
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[#1A1A1A]">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-[#666666] font-body mt-3">
          The page you are looking for has moved, sold out, or never existed.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/shop"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/shop');
            }}
            className="min-h-[48px] px-6 py-3 bg-[#C2A77A] hover:bg-[#B39665] text-[#111111] font-heading font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center transition-colors"
          >
            Shop the Collection
          </a>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="min-h-[48px] px-6 py-3 bg-white border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white font-heading font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
