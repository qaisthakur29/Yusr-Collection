import React, { useState } from 'react';
import { MessageCircle, Mail, Clock, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    orderId: '',
    message: '',
  });

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = `Salam Yusr Team!
Name: ${formData.name || 'Customer'}
${formData.orderId ? `Order ID: ${formData.orderId}\n` : ''}Message: ${formData.message}`;

    const url = `https://wa.me/919326184407?text=${encodeURIComponent(queryText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white min-h-[100dvh] py-12 sm:py-20 flex flex-col justify-center">
      <div className="max-w-xl mx-auto px-4 sm:px-6 w-full text-center">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block text-xs font-heading font-bold uppercase tracking-[0.2em] text-[#C2A77A] mb-2">
            DIRECT DESK
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#1A1A1A]">
            CONTACT US
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] font-body mt-2 max-w-md mx-auto">
            Got questions about sizing, a custom drop, or tracking your gear? We are here to help.
          </p>
        </div>

        {/* Large WhatsApp Primary Button (Green #25D366) */}
        <div className="mb-10 space-y-3">
          <a
            href="https://wa.me/919326184407?text=Salam!%20I%20have%20an%20inquiry%20regarding%20Yusr%20Collection:"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[56px] py-4 px-6 bg-[#25D366] hover:bg-[#20ba59] text-white font-heading font-bold text-sm sm:text-base uppercase tracking-[0.05em] transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
          >
            <MessageCircle className="w-6 h-6 fill-white text-[#25D366]" />
            <span>CHAT ON WHATSAPP (+91 9326184407)</span>
          </a>
          <span className="text-[11px] text-[#666666] font-body block">
            ⚡ Fastest response time · 10:00 AM – 8:00 PM IST
          </span>
        </div>

        {/* Direct Email Card */}
        <div className="p-6 bg-[#F9F9F9] border border-[#E5E5E5] text-center mb-8">
          <div className="w-10 h-10 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center mx-auto mb-3 text-[#1A1A1A]">
            <Mail className="w-5 h-5 text-[#C2A77A]" />
          </div>
          <div className="text-xs font-heading font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">
            Email Support
          </div>
          <a
            href="mailto:yusrrcollections@gmail.com"
            className="font-body text-sm sm:text-base font-semibold text-[#1A1A1A] hover:text-[#C2A77A] underline transition-colors"
          >
            yusrrcollections@gmail.com
          </a>
          <p className="text-[11px] text-[#666666] mt-1 font-body">
            For business collaborations, bulk queries, and order support.
          </p>
        </div>

        {/* Quick Message Helper */}
        <div className="p-6 border border-[#E5E5E5] text-left mb-8">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1A1A1A] mb-4">
            Quick Inquiry Composer
          </h3>
          <form onSubmit={handleSendWhatsApp} className="space-y-3">
            <div>
              <label className="block text-[11px] font-heading font-semibold uppercase mb-1">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Bilal"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full min-h-[44px] px-3.5 border border-[#E5E5E5] text-xs focus:outline-none focus:border-[#C2A77A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-heading font-semibold uppercase mb-1">Order ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. YUSR-10482"
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                className="w-full min-h-[44px] px-3.5 border border-[#E5E5E5] text-xs uppercase focus:outline-none focus:border-[#C2A77A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-heading font-semibold uppercase mb-1">Your Message</label>
              <textarea
                rows={3}
                required
                placeholder="Type your question or size query here..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-3 border border-[#E5E5E5] text-xs focus:outline-none focus:border-[#C2A77A]"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[44px] py-3 bg-[#1A1A1A] hover:bg-neutral-800 text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>Send via WhatsApp</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* NO Physical Address Disclaimer (Strict requirement) */}
        <div className="p-4 bg-[#F4F4F4] border border-[#E5E5E5] text-xs text-[#666666] flex items-start gap-2.5 text-left">
          <AlertCircle className="w-4 h-4 text-[#1A1A1A] shrink-0 mt-0.5" />
          <p>
            <strong>Digital & Direct Fulfillment Only:</strong> We do not operate a physical walk-in storefront. All pieces are printed and dispatched directly through our centralized fulfillment partners (Qikink) to maintain the highest quality and deliver anywhere across India.
          </p>
        </div>
      </div>
    </div>
  );
}
