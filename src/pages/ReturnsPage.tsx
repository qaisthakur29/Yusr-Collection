import React from 'react';
import { ShieldAlert, Video, MessageCircle, AlertCircle } from 'lucide-react';

export function ReturnsPage() {
  return (
    <div className="bg-white min-h-[100dvh] py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="border-b border-[#E5E5E5] pb-6 mb-8 text-center sm:text-left">
          <div className="text-xs font-heading font-bold uppercase tracking-[0.15em] text-[#C2A77A] mb-1">
            CUSTOMER CARE
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[#1A1A1A]">
            RETURNS & EXCHANGE POLICY
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] font-body mt-1">
            Please read carefully before ordering. We want you to love your gear.
          </p>
        </div>

        {/* Intro */}
        <div className="p-4 bg-[#F7F4EE] border border-[#C2A77A]/40 mb-8 text-xs sm:text-sm font-body text-[#1A1A1A] leading-relaxed">
          At <span className="font-bold">Yusr Collection</span>, every single piece is custom-printed specifically for you (<span className="font-semibold">Made-to-Order</span>). Because of this, we follow a strict but fair policy aligned with our printing partners (Qikink).
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 font-body text-[#1A1A1A] text-sm sm:text-base leading-relaxed">
          
          {/* Section 1: Size Exchange */}
          <div className="p-5 border border-[#E5E5E5] bg-[#FFFFFF] shadow-2xs space-y-3">
            <h2 className="font-heading font-bold text-base uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs">1</span>
              Size Exchange (Allowed)
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              If the size doesn't fit you as expected, we offer a <span className="font-semibold text-[#1A1A1A]">one-time size exchange</span>.
            </p>
            <div className="bg-[#F9F9F9] p-3 text-xs space-y-2 border-l-2 border-[#1A1A1A]">
              <p>
                <strong>Condition:</strong> The exchange request must be raised within <span className="font-bold text-[#1A1A1A]">48 hours of delivery</span>. The product must be unused, unwashed, and have all original tags intact.
              </p>
              <p>
                <strong>Shipping:</strong> The customer will bear the shipping cost to send the product back to our warehouse. We will cover the shipping to send the new size to you.
              </p>
            </div>
          </div>

          {/* Section 2: Damaged / Defective & Unboxing Video Rule */}
          <div className="p-5 border-2 border-amber-300 bg-amber-50/50 space-y-3">
            <h2 className="font-heading font-bold text-base uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">2</span>
              Damaged or Defective Product (Free Replacement)
            </h2>
            <p className="text-xs sm:text-sm text-[#1A1A1A]">
              If you receive a damaged, torn, or misprinted item, we will replace it for free.
            </p>
            
            <div className="p-3.5 bg-white border border-amber-200 text-xs space-y-2">
              <div className="flex items-start gap-2 text-amber-900 font-semibold uppercase font-heading text-[11px] tracking-wider">
                <Video className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Mandatory Continuous Unboxing Video:</span>
              </div>
              <p className="text-[#1A1A1A] leading-relaxed">
                You must record a clear video while opening the package (<span className="font-bold">Unboxing Video</span>) showing the shipping label and the defect.
              </p>
              <p className="text-red-700 font-semibold">
                Without an unboxing video, we cannot process replacement claims for damages.
              </p>
            </div>
          </div>

          {/* Section 3: No Refunds for Change of Mind */}
          <div className="p-5 border border-[#E5E5E5] bg-[#FFFFFF] space-y-3">
            <h2 className="font-heading font-bold text-base uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs">3</span>
              No Refunds for "Change of Mind"
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              We do not offer monetary refunds. We only offer size exchanges or replacements for defects. Please check our size chart carefully before ordering.
            </p>
          </div>

          {/* Section 4: How to Raise a Request */}
          <div className="p-5 border border-[#E5E5E5] bg-[#FBFBFB] space-y-3">
            <h2 className="font-heading font-bold text-base uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs">4</span>
              How to Raise a Request?
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              WhatsApp us at <span className="font-bold text-[#1A1A1A]">+91 9326184407</span> with your Order ID and the Unboxing Video (if applicable) within the 48-hour time frame.
            </p>

            <div className="pt-2">
              <a
                href="https://wa.me/919326184407?text=Salam!%20I%20want%20to%20raise%20a%20Return/Exchange%20request%20for%20Order%20ID:"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[46px] px-6 py-3 bg-[#25D366] text-white font-heading font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Support (+91 9326184407)</span>
              </a>
            </div>
          </div>

          {/* Physical Address Notice */}
          <div className="p-4 bg-[#F4F4F4] border border-[#E5E5E5] text-xs text-[#666666] flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-[#1A1A1A] shrink-0 mt-0.5" />
            <p>
              <strong>Note:</strong> No physical walk-in address is displayed as we operate exclusively via our centralized printing and fulfillment partners to keep costs low and quality high. All communications are handled digitally via WhatsApp and Email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
