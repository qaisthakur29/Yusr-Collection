import React, { useRef, useState } from 'react';
import { Product } from '../data/products';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCardImageProps {
  product: Product;
  children?: React.ReactNode;
}

export function ProductCardImage({ product, children }: ProductCardImageProps) {
  const allImages = [product.image, ...(product.gallery || [])].filter(Boolean);
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Arrow click par exact next/prev image par scroll karne ke liye
  const scrollToImage = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = current.clientWidth;
      let newIndex = activeIndex;

      if (direction === 'left') {
        newIndex = Math.max(0, activeIndex - 1);
      } else {
        newIndex = Math.min(allImages.length - 1, activeIndex + 1);
      }

      current.scrollTo({
        left: newIndex * scrollAmount,
        behavior: 'smooth',
      });
      setActiveIndex(newIndex);
    }
  };

  // Mobile swipe hone par index update karne ke liye
  const handleScroll = () => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const index = Math.round(current.scrollLeft / current.clientWidth);
      setActiveIndex(index);
    }
  };

  return (
    <div
      className="relative w-full aspect-[4/5] overflow-hidden bg-[#F8F8F8] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Touch Swipe Container (Mobile) & Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {allImages.map((img, idx) => (
          <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
            <img
              src={img}
              alt={`${product.name} ${idx + 1}`}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-transform duration-300 ease-out ${
                isHovered ? 'scale-105' : 'scale-100'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Desktop Arrows (Z-20 ensures they are ABOVE the overlay) */}
      {allImages.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation(); // Prevents opening product page
              scrollToImage('left');
            }}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-[#1A1A1A] z-20 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation(); // Prevents opening product page
              scrollToImage('right');
            }}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-[#1A1A1A] z-20 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Badge & Quick Add Button (Rendered normally, no overlay blocking) */}
      {children}
    </div>
  );
}