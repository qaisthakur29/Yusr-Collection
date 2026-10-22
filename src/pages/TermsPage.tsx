import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="bg-white min-h-[100dvh] py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="border-b border-[#E5E5E5] pb-6 mb-8 text-center sm:text-left">
          <div className="text-xs font-heading font-bold uppercase tracking-[0.15em] text-[#C2A77A] mb-1">
            LEGAL
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[#1A1A1A]">
            TERMS & CONDITIONS
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] font-body mt-1">
            Welcome to Yusr Collection. By accessing this website and/or placing an order, you agree to be bound by the following terms:
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 font-body text-[#1A1A1A] leading-relaxed">
          
          <div className="p-5 border border-[#E5E5E5] bg-[#FFFFFF] space-y-2">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C2A77A]" />
              Made-to-Order Products
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              All our products are custom-printed on demand. Therefore, slight variations in color or print placement (up to 5%) may occur. This is not considered a defect.
            </p>
          </div>

          <div className="p-5 border border-[#E5E5E5] bg-[#FFFFFF] space-y-2">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C2A77A]" />
              Pricing
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              All prices are in INR (₹) and are inclusive of applicable taxes. We reserve the right to change prices without prior notice.
            </p>
          </div>

          <div className="p-5 border border-[#E5E5E5] bg-[#FFFFFF] space-y-2">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C2A77A]" />
              Intellectual Property
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              All designs, graphics, logos, and text on this website are the intellectual property of Yusr Collection. You may not reproduce, copy, or resell our designs.
            </p>
          </div>

          <div className="p-5 border border-[#E5E5E5] bg-[#FFFFFF] space-y-2">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C2A77A]" />
              Order Cancellation
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              We reserve the right to cancel any order due to incorrect address, suspicious payment activity, or stock unavailability. In such cases, a full refund will be initiated to the original payment method.
            </p>
          </div>

          <div className="p-5 border border-[#E5E5E5] bg-[#FFFFFF] space-y-2">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C2A77A]" />
              Governing Law
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              These terms are governed by the laws of India.
            </p>
          </div>

          <div className="pt-4 text-xs text-[#888888]">
            For any clarifications regarding our terms, reach out to us at <a href="mailto:yusrrcollections@gmail.com" className="text-[#1A1A1A] underline">yusrrcollections@gmail.com</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
