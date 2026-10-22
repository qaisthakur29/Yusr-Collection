import React, { useState } from 'react';
import { Search, PackageCheck, Printer, Truck, CheckCircle2, MessageCircle, Clock } from 'lucide-react';

export function TrackOrderPage() {
  const [orderQuery, setOrderQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<{
    id: string;
    status: string;
    step: number;
    estimatedDelivery: string;
  } | null>(null);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    // Simulate real order lookup state
    const cleanId = orderQuery.trim().toUpperCase();
    setSearchedOrder({
      id: cleanId.startsWith('YUSR') ? cleanId : `YUSR-${cleanId}`,
      status: 'Custom Printing in Progress (3-5 Business Days)',
      step: 2,
      estimatedDelivery: '7-10 Business Days from order placement',
    });
  };

  return (
    <div className="bg-white min-h-[100dvh] py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="border-b border-[#E5E5E5] pb-6 mb-8 text-center sm:text-left">
          <div className="text-xs font-heading font-bold uppercase tracking-[0.15em] text-[#C2A77A] mb-1">
            FULFILLMENT & LOGISTICS
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[#1A1A1A]">
            TRACK YOUR ORDER
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] font-body mt-1">
            Waiting for your Yusr gear? We know the excitement!
          </p>
        </div>

        {/* Interactive Order Lookup Box */}
        <div className="p-6 bg-[#FBFBFB] border border-[#E5E5E5] mb-10 shadow-2xs">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-[#1A1A1A] mb-2">
            Check Live Status
          </h2>
          <p className="text-xs text-[#666666] mb-4 font-body">
            Enter your Order ID received via WhatsApp / Email (e.g., YUSR-10482):
          </p>
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Order ID (e.g. YUSR-10482)"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                className="w-full min-h-[44px] pl-10 pr-3.5 border border-[#E5E5E5] bg-white text-xs sm:text-sm uppercase focus:outline-none focus:border-[#C2A77A]"
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 bg-[#C2A77A] hover:bg-[#B39665] text-[#111111] font-heading font-bold text-xs uppercase tracking-wider transition-colors"
            >
              TRACK ORDER
            </button>
          </form>

          {/* Search Result Visual Timeline */}
          {searchedOrder && (
            <div className="mt-6 pt-6 border-t border-[#E5E5E5] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-heading uppercase text-[#666666]">Status for</span>
                  <div className="font-heading font-bold text-base text-[#1A1A1A]">{searchedOrder.id}</div>
                </div>
                <span className="px-2.5 py-1 bg-[#F7F4EE] border border-[#C2A77A] text-[11px] font-heading font-bold text-[#1A1A1A] uppercase">
                  ACTIVE
                </span>
              </div>

              {/* Progress Bar */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-heading font-bold uppercase text-[#1A1A1A]">Confirmed</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-[#C2A77A] text-[#111111] flex items-center justify-center text-xs mb-1">
                    <Printer className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-heading font-bold uppercase text-[#1A1A1A]">Printing</span>
                </div>
                <div className="flex flex-col items-center text-center opacity-40">
                  <div className="w-8 h-8 rounded-full bg-[#E5E5E5] text-[#666666] flex items-center justify-center text-xs mb-1">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-heading font-bold uppercase text-[#666666]">Dispatched</span>
                </div>
                <div className="flex flex-col items-center text-center opacity-40">
                  <div className="w-8 h-8 rounded-full bg-[#E5E5E5] text-[#666666] flex items-center justify-center text-xs mb-1">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-heading font-bold uppercase text-[#666666]">Delivered</span>
                </div>
              </div>

              <p className="text-xs text-[#666666] font-body text-center pt-2">
                Current Stage: <span className="text-[#1A1A1A] font-semibold">{searchedOrder.status}</span>. You will receive an SMS and WhatsApp tracking link once handed over to the courier partner.
              </p>
            </div>
          )}
        </div>

        {/* Exact Educational Text from provided file */}
        <div className="space-y-6 font-body text-[#1A1A1A] leading-relaxed">
          <p className="text-sm sm:text-base text-[#666666]">
            Since all our products are made-to-order, here is how you can track your package:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 border border-[#E5E5E5] bg-white space-y-2">
              <div className="flex items-center gap-2 font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                <CheckCircle2 className="w-4 h-4 text-[#C2A77A]" />
                1. Order Confirmation
              </div>
              <p className="text-xs text-[#666666]">
                Once you place an order, you will receive a confirmation email/WhatsApp message immediately.
              </p>
            </div>

            <div className="p-4 border border-[#E5E5E5] bg-white space-y-2">
              <div className="flex items-center gap-2 font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                <Clock className="w-4 h-4 text-[#C2A77A]" />
                2. Printing & Packing
              </div>
              <p className="text-xs text-[#666666]">
                Your order is sent to our printing partner. This takes 3-5 business days to guarantee zero defects.
              </p>
            </div>

            <div className="p-4 border border-[#E5E5E5] bg-white space-y-2">
              <div className="flex items-center gap-2 font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                <Truck className="w-4 h-4 text-[#C2A77A]" />
                3. Shipping
              </div>
              <p className="text-xs text-[#666666]">
                As soon as your order is dispatched, we will send you a Tracking Link via Email and WhatsApp.
              </p>
            </div>

            <div className="p-4 border border-[#E5E5E5] bg-white space-y-2">
              <div className="flex items-center gap-2 font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                <PackageCheck className="w-4 h-4 text-[#C2A77A]" />
                4. Delivery
              </div>
              <p className="text-xs text-[#666666]">
                You can click that link to see exactly where your package is. Transit takes 4-7 days.
              </p>
            </div>
          </div>

          {/* Help Box for delays */}
          <div className="p-6 bg-[#F9F9F9] border-l-4 border-[#C2A77A] mt-8 space-y-3">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#1A1A1A]">
              Still haven't received a tracking link after 6 days?
            </h3>
            <p className="text-xs sm:text-sm text-[#666666]">
              Don't worry, just WhatsApp us your Order ID at <span className="font-bold text-[#1A1A1A]">+91 9326184407</span>, and we will update you immediately.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/919326184407?text=Salam!%20I%20need%20a%20tracking%20update%20for%20my%20Order%20ID:"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-6 py-2.5 bg-[#25D366] text-white font-heading font-bold text-xs uppercase tracking-wide inline-flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Order Support</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
