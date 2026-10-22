import React from 'react';
import { Shield, Lock, EyeOff, Server } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-[100dvh] py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="border-b border-[#E5E5E5] pb-6 mb-8 text-center sm:text-left">
          <div className="text-xs font-heading font-bold uppercase tracking-[0.15em] text-[#C2A77A] mb-1">
            LEGAL
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[#1A1A1A]">
            PRIVACY POLICY
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] font-body mt-1">
            At Yusr Collection, your privacy is our priority. This policy explains how we collect and use your data.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 font-body text-sm sm:text-base text-[#1A1A1A] leading-relaxed">
          
          <div className="p-5 border border-[#E5E5E5] bg-[#FFFFFF] space-y-2">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-[#C2A77A]" />
              Information We Collect
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              When you place an order, we collect your name, shipping address, email, and phone number.
            </p>
          </div>

          <div className="p-5 border border-[#E5E5E5] bg-[#FFFFFF] space-y-2">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <Server className="w-4 h-4 text-[#C2A77A]" />
              How We Use It
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              We use this information solely to process your order, ship the product to you, and send order updates via WhatsApp/Email.
            </p>
          </div>

          <div className="p-5 border border-[#E5E5E5] bg-[#FFFFFF] space-y-2">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#C2A77A]" />
              Payment Security
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              We do not store your credit/debit card or UPI details. All payments are processed through secure third-party payment gateways (like Razorpay) which comply with PCI-DSS standards.
            </p>
          </div>

          <div className="p-5 border border-[#E5E5E5] bg-[#FFFFFF] space-y-2">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#C2A77A]" />
              Third-Party Partners
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              We share your shipping address with our printing and courier partners (Qikink) strictly for the purpose of fulfilling your order.
            </p>
          </div>

          <div className="p-5 border border-[#E5E5E5] bg-[#FFFFFF] space-y-2">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide text-[#1A1A1A] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#C2A77A]" />
              Marketing & Data Sharing
            </h2>
            <p className="text-xs sm:text-sm text-[#666666]">
              We will never sell or rent your data to third parties. You can opt out of our promotional messages at any time.
            </p>
          </div>

          <div className="pt-4 text-xs text-[#888888]">
            Last updated: October 2026. For inquiries, email us at <a href="mailto:yusrrcollections@gmail.com" className="text-[#1A1A1A] underline">yusrrcollections@gmail.com</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
