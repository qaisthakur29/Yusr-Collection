import React, { useEffect, useState } from 'react';
import { Product, SIZE_CHART } from '../data/products';
import { useCart } from '../context/CartContext';
import { optimizeImage } from '../lib/image';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronDown,
  Check,
  MessageCircle,
  Share2,
  Ruler,
  ShoppingBag,
} from 'lucide-react';

interface ProductDetailPageProps {
  product: Product;
  onNavigate: (path: string) => void;
  onBack: () => void;
}

export function ProductDetailPage({ product, onNavigate, onBack }: ProductDetailPageProps) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL'>('L');
  const [activeImage, setActiveImage] = useState(product.image);
  const [openAccordion, setOpenAccordion] = useState<string | null>('desc');
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setActiveImage(product.image);
  }, [product.id, product.image]);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleAddToCart = () => {
    addToCart(product, selectedSize, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleWhatsAppOrder = () => {
    const msg = `Salam! I would like to order *${product.name}* (Size: ${selectedSize}) for ₹${product.price}. Please share payment details and dispatch timeline.`;
    const url = `https://wa.me/919326184407?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `${product.name} - Yusr Collection`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const galleryImages = (product.gallery ?? []).map((url) => url.trim()).filter(Boolean);
  const images =
    galleryImages.length > 0
      ? Array.from(new Set([product.image, ...galleryImages].filter(Boolean)))
      : [product.image];

  return (
    <div className="bg-white min-h-[100dvh] py-6 sm:py-12">
      {/* Breadcrumb & Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-between text-xs text-[#666666]">
          <div className="flex items-center gap-2 font-heading uppercase tracking-wider">
            <button onClick={onBack} className="hover:text-[#1A1A1A] underline">
              Home
            </button>
            <span>/</span>
            <button onClick={() => onNavigate('/shop')} className="hover:text-[#1A1A1A] underline">
              Catalog
            </button>
            <span>/</span>
            <span className="text-[#1A1A1A] font-semibold truncate max-w-[150px] sm:max-w-none">
              {product.name}
            </span>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-heading font-semibold hover:text-[#1A1A1A] min-h-[44px] px-2"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stacked on mobile, 50/50 split on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
          
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] w-full bg-[#F5F5F5] border border-[#E5E5E5] overflow-hidden">
              <img
                src={optimizeImage(activeImage, 1000)}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
              {product.badge && (
                <div className="absolute top-4 left-4 bg-[#1A1A1A] text-white px-3 py-1 text-xs font-heading font-bold uppercase tracking-wider">
                  {product.badge}
                </div>
              )}
            </div>

            {/* Thumbnail Selectors if multiple images exist */}
            {galleryImages.length > 0 && (
              <div className="flex items-center gap-3 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-20 h-24 border overflow-hidden transition-all ${
                      activeImage === img
                        ? 'border-[#1A1A1A] ring-1 ring-[#1A1A1A]'
                        : 'border-[#E5E5E5] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={optimizeImage(img, 200)}
                      alt={`${product.name} view ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Quality Seals */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-[#FBFBFB] border border-[#E5E5E5] text-center text-xs">
              <div>
                <span className="block font-heading font-bold text-[#1A1A1A] uppercase">240 GSM</span>
                <span className="text-[11px] text-[#666666]">Heavy Cotton</span>
              </div>
              <div className="border-x border-[#E5E5E5]">
                <span className="block font-heading font-bold text-[#1A1A1A] uppercase">Pre-Shrunk</span>
                <span className="text-[11px] text-[#666666]">Zero Distortion</span>
              </div>
              <div>
                <span className="block font-heading font-bold text-[#1A1A1A] uppercase">DTF Print</span>
                <span className="text-[11px] text-[#666666]">Fade Resistant</span>
              </div>
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module */}
          <div className="flex flex-col space-y-6">
            
            {/* Title & Tagline */}
            <div>
              <span className="text-xs font-heading font-bold text-[#C2A77A] tracking-[0.15em] uppercase block mb-1">
                {product.tag || 'YUSR ORIGINAL DROP'}
              </span>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl uppercase tracking-[0.02em] text-[#1A1A1A] leading-tight">
                {product.name}
              </h1>
              {product.subname && (
                <p className="font-heading font-semibold text-xs sm:text-sm text-[#666666] uppercase tracking-wide mt-1">
                  "{product.subname}"
                </p>
              )}
            </div>

            {/* Price Block */}
            <div className="flex items-baseline gap-3 pb-4 border-b border-[#E5E5E5]">
              <span className="font-heading font-bold text-2xl sm:text-3xl text-[#1A1A1A] tabular-nums">
                ₹{product.price}
              </span>
              <span className="font-body text-base text-[#666666] line-through tabular-nums">
                ₹{product.mrp}
              </span>
              <span className="bg-[#F7F4EE] text-[#1A1A1A] border border-[#C2A77A] px-2 py-0.5 text-xs font-heading font-bold uppercase">
                Save ₹{product.mrp - product.price} (33% OFF)
              </span>
            </div>

            {/* Size Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                  Select Size (Drop-Shoulder Fit)
                </span>
                <button
                  type="button"
                  onClick={() => setShowSizeModal(true)}
                  className="flex items-center gap-1 text-xs font-heading font-semibold text-[#666666] hover:text-[#1A1A1A] underline tracking-wider uppercase min-h-[44px]"
                >
                  <Ruler className="w-3.5 h-3.5 text-[#C2A77A]" />
                  <span>Size Guide</span>
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-h-[48px] flex items-center justify-center font-heading font-bold text-sm tracking-wide transition-all border ${
                      selectedSize === size
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                        : 'bg-white text-[#1A1A1A] border-[#E5E5E5] hover:border-[#1A1A1A]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#666666] mt-2 font-body">
                💡 Oversized streetwear cut. If you want a standard fitted look, order one size down.
              </p>
            </div>

            {/* Action Buttons (Strict min 44px Android touch targets) */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full min-h-[50px] py-4 bg-[#C2A77A] hover:bg-[#B39665] text-[#111111] font-heading font-bold text-sm uppercase tracking-[0.05em] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {justAdded ? (
                  <>
                    <Check className="w-5 h-5 text-[#111111]" />
                    <span>ADDED TO BAG!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5 text-[#111111]" />
                    <span>ADD TO BAG · ₹{product.price}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="w-full min-h-[48px] py-3.5 bg-transparent border-2 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] font-heading font-bold text-xs sm:text-sm uppercase tracking-[0.05em] transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>DIRECT ORDER VIA WHATSAPP</span>
              </button>
            </div>

            {/* Quick Delivery Guarantee */}
            <div className="p-3.5 bg-[#F9F9F9] border border-[#E5E5E5] space-y-2 text-xs font-body">
              <div className="flex items-center gap-2.5 text-[#1A1A1A]">
                <Truck className="w-4 h-4 text-[#C2A77A] shrink-0" />
                <span>Free Shipping Pan-India on Prepaid | COD Available</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#1A1A1A]">
                <RotateCcw className="w-4 h-4 text-[#C2A77A] shrink-0" />
                <span>48-Hour Size Exchange (Unboxing Video Required)</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#1A1A1A]">
                <ShieldCheck className="w-4 h-4 text-[#C2A77A] shrink-0" />
                <span>Made-to-Order Custom Print (Dispatches in 3-5 days)</span>
              </div>
            </div>

            {/* Accordions for Description, Size Chart, Shipping, Returns */}
            <div className="border-t border-[#E5E5E5] divide-y divide-[#E5E5E5] pt-2">
              
              {/* Accordion 1: Description */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('desc')}
                  className="w-full py-4 flex items-center justify-between text-left font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]"
                >
                  <span>PRODUCT SPECIFICATIONS & FABRIC</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openAccordion === 'desc' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'desc' && (
                  <div className="pb-4 text-xs text-[#666666] font-body space-y-2 leading-relaxed">
                    <p>{product.description}</p>
                    <ul className="list-disc list-inside space-y-1 pt-1 text-[#1A1A1A]">
                      {product.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                    <p className="pt-2 text-[11px] text-[#666666]">
                      Wash care: Machine wash cold inside-out with like colors. Do not iron directly on the print.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 2: Size Chart Table */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('size')}
                  className="w-full py-4 flex items-center justify-between text-left font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]"
                >
                  <span>SIZE CHART & MEASUREMENTS</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openAccordion === 'size' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'size' && (
                  <div className="pb-4 overflow-x-auto">
                    <table className="w-full text-xs text-left border border-[#E5E5E5]">
                      <thead className="bg-[#F8F8F8] font-heading font-bold uppercase text-[#1A1A1A] border-b border-[#E5E5E5]">
                        <tr>
                          <th className="p-2">Size</th>
                          <th className="p-2">Chest (Inches)</th>
                          <th className="p-2">Length</th>
                          <th className="p-2">Shoulder</th>
                          <th className="p-2">Sleeve</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5] font-body text-[#666666]">
                        {SIZE_CHART.map((r) => (
                          <tr key={r.size} className={selectedSize === r.size ? 'bg-[#F7F4EE]' : ''}>
                            <td className="p-2 font-bold font-heading text-[#1A1A1A]">{r.size}</td>
                            <td className="p-2">{r.chest}</td>
                            <td className="p-2">{r.length}</td>
                            <td className="p-2">{r.shoulder}</td>
                            <td className="p-2">{r.sleeve}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Accordion 3: Shipping */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full py-4 flex items-center justify-between text-left font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]"
                >
                  <span>SHIPPING & DELIVERY TIMELINES</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openAccordion === 'shipping' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'shipping' && (
                  <div className="pb-4 text-xs text-[#666666] font-body space-y-2 leading-relaxed">
                    <p>
                      <strong>Custom Made-to-Order:</strong> Printing & packing takes 3-5 business days.
                    </p>
                    <p>
                      <strong>Pan-India Shipping:</strong> Transit takes 4-7 days via premium couriers. Total timeline is 7-10 working days.
                    </p>
                    <p>
                      <strong>Payment Options:</strong> Prepaid (UPI/Cards) qualifies for ₹50 instant discount and priority dispatch. Cash on Delivery (COD) is available across India.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 4: Returns & Exchange */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('return')}
                  className="w-full py-4 flex items-center justify-between text-left font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]"
                >
                  <span>RETURN & EXCHANGE POLICY (48H RULE)</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openAccordion === 'return' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'return' && (
                  <div className="pb-4 text-xs text-[#666666] font-body space-y-2 leading-relaxed">
                    <p className="text-[#1A1A1A] font-semibold">
                      ⚠️ Mandatory 48-Hour Unboxing Video:
                    </p>
                    <p>
                      In order to claim a free replacement for defective or torn items, a continuous video recorded while opening the parcel showing the shipping label is strictly mandatory.
                    </p>
                    <p>
                      <strong>Size Exchange:</strong> We offer a 1-time size exchange within 48 hours of delivery. Customer ships product back; we send the replacement size.
                    </p>
                    <p>
                      <strong>No Monetary Refunds:</strong> Because all products are custom printed upon order, we do not offer refunds for change of mind.
                    </p>
                    <button
                      onClick={() => onNavigate('/returns')}
                      className="text-xs font-heading font-bold text-[#1A1A1A] underline uppercase pt-1 inline-block"
                    >
                      Read Complete Returns Policy →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Buy Bar on Mobile (Android-Optimized) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#E5E5E5] p-3 z-30 flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#666666] uppercase font-heading">Total Price</span>
          <span className="font-heading font-bold text-base text-[#1A1A1A] tabular-nums">
            ₹{product.price}
          </span>
        </div>
        <button
          onClick={handleAddToCart}
          className="flex-1 min-h-[46px] py-3 bg-[#C2A77A] text-[#111111] font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add to Bag ({selectedSize})</span>
        </button>
      </div>

      {/* Size Guide Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          {/* Added max-h and overflow-y-auto so long images scroll inside the modal */}
          <div className="bg-white max-w-lg w-full p-6 text-[#1A1A1A] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-[#E5E5E5]">
              <h3 className="font-heading font-bold text-base uppercase tracking-wider">
                Size Guide
              </h3>
              <button
                onClick={() => setShowSizeModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#666666] hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            </div>

            {product.size_guide_url ? (
              <div className="mt-4">
                <img
                  src={optimizeImage(product.size_guide_url, 1000)}
                  alt={`${product.name} size guide`}
                  loading="lazy"
                  className="w-full h-auto object-contain bg-[#FBFBFB] border border-[#E5E5E5]"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <>
                <p className="text-xs text-[#666666] my-3 font-body">
                  Our tees feature a custom drop-shoulder oversized streetwear fit. If you prefer a regular tailored fit, consider sizing down.
                </p>
                <div className="overflow-x-auto border border-[#E5E5E5]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8F8F8] font-heading font-bold uppercase text-[#1A1A1A] border-b border-[#E5E5E5]">
                      <tr>
                        <th className="p-2.5">Size</th>
                        <th className="p-2.5">Chest</th>
                        <th className="p-2.5">Length</th>
                        <th className="p-2.5">Shoulder</th>
                        <th className="p-2.5">Sleeve</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] font-body">
                      {SIZE_CHART.map((row) => (
                        <tr key={row.size} className="hover:bg-neutral-50">
                          <td className="p-2.5 font-bold font-heading">{row.size}</td>
                          <td className="p-2.5">{row.chest}</td>
                          <td className="p-2.5">{row.length}</td>
                          <td className="p-2.5">{row.shoulder}</td>
                          <td className="p-2.5">{row.sleeve}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex justify-end">
              <button
                onClick={() => setShowSizeModal(false)}
                className="min-h-[40px] px-6 bg-[#1A1A1A] text-white font-heading font-bold text-xs uppercase"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}