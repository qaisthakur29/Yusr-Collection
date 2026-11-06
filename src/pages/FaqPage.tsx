import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { FAQ_ITEMS } from '../lib/seo';

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="bg-white min-h-[100dvh] py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="border-b border-[#E5E5E5] pb-6 mb-8 text-center sm:text-left">
          <div className="text-xs font-heading font-bold uppercase tracking-[0.15em] text-[#C2A77A] mb-1">
            NEED HELP?
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[#1A1A1A]">
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] font-body mt-1">
            Quick answers about made-to-order fulfillment, sizing, COD, and washing care.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="divide-y divide-[#E5E5E5] border border-[#E5E5E5]">
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="bg-white">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full py-5 px-5 text-left flex items-center justify-between gap-4 transition-colors hover:bg-neutral-50"
                >
                  <span className="font-heading font-bold text-xs sm:text-sm uppercase tracking-wide text-[#1A1A1A]">
                    Q{idx + 1}. {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#C2A77A] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#666666] font-body leading-relaxed border-t border-[#F0F0F0] bg-[#FAF9F6]">
                    <p className="pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still Have Questions Box */}
        <div className="mt-10 p-6 bg-[#F9F9F9] border border-[#E5E5E5] text-center space-y-3">
          <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#1A1A1A]">
            Still have a question?
          </h3>
          <p className="text-xs text-[#666666] max-w-md mx-auto font-body">
            Our team is available on WhatsApp to assist you with order updates or sizing advice.
          </p>
          <a
            href="https://wa.me/919326184407"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-6 py-2.5 bg-[#25D366] text-white font-heading font-bold text-xs uppercase tracking-wide inline-flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp (+91 9326184407)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
