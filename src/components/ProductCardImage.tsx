import React, { useState } from 'react';
import { Product } from '../data/products';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCardImageProps {
  product: Product;
  children?: React.ReactNode;
}

export function ProductCardImage({ product, children }: ProductCardImageProps) {
  // Main image aur gallery ko mila kar ek array banaya
  const allImages = [product.image, ...(product.gallery || [])].filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Taaki product page na khule
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div
      className="relative w-full aspect-[4/5] overflow-hidden bg-[#F8F8F8] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={allImages[currentIndex]}
        alt={product.name}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
          isHovered ? 'scale-105' : 'scale-100'
        }`}
      />

      {/* Left/Right Arrows (Sirf tab dikhenge jab 1 se zyada image ho) */}
      {allImages.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-[#1A1A1A] transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextImage}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-[#1A1A1A] transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {children}
    </div>
  );
}