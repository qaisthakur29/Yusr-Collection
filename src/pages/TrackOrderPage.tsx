import React, { useState } from 'react';
import {
  Search,
  Package,
  PackageCheck,
  Truck,
  CheckCircle2,
  MessageCircle,
  Clock,
  SearchX,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type TrackedOrder = {
  id: string;
  order_number: string | null;
  status: string;
  tracking_url: string | null;
  created_at: string;
};

// Confirmed (0) -> Processing (1) -> Dispatched (2) -> Delivered (3)
function statusStep(status: string): number {
  const s = status.toLowerCase();
  if (s.includes('deliver')) return 3;
  if (s.includes('dispatch') || s.includes('ship') || s.includes('transit')) return 2;
  return 1; // Pending / Paid / Processing — being prepared
}

const STEPS = [
  { label: 'Confirmed', Icon: CheckCircle2 },
  { label: 'Processing', Icon: Package },
  { label: 'Dispatched', Icon: Truck },
  { label: 'Delivered', Icon: PackageCheck },
];

export function TrackOrderPage() {
  const [orderQuery, setOrderQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = orderQuery.trim();
    if (!raw) return;

    setLoading(true);
    setNotFound(false);
    setOrder(null);

    // Order rows are not readable by anon clients (INSERT-only RLS), so the
    // lookup runs through the public track-order Edge Function.
    const { data, error } = await supabase.functions.invoke('track-order', {
      body: { order_number: raw },
    });

    setLoading(false);

    if (error || data?.error || !data?.order) {
      setNotFound(true);
      return;
    }

    setOrder(data.order as TrackedOrder);
  };

  const currentStep = order ? statusStep(order.status) : 0;

  // A usable courier link must be a real URL; an empty or whitespace-only string
  // would otherwise render a dead "Track Package" button.
  const trackingUrl = order?.tracking_url?.trim() ?? '';
  const hasTrackingLink = currentStep === 2 && trackingUrl.length > 5;

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
            Enter the Order ID you received via WhatsApp / Email:
          </p>
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Order ID (e.g., YUSR-123456)"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                className="w-full min-h-[44px] pl-10 pr-3.5 border border-[#E5E5E5] bg-white text-xs sm:text-sm focus:outline-none focus:border-[#C2A77A]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[44px] px-6 py-2.5 bg-[#C2A77A] hover:bg-[#B39665] text-[#111111] font-heading font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-60"
            >
              {loading ? 'CHECKING…' : 'TRACK ORDER'}
            </button>
          </form>

          {/* Result — Order Not Found */}
          {notFound && (
            <div className="mt-6 pt-6 border-t border-[#E5E5E5]">
              <div className="bg-white border border-[#E5E5E5] p-6 sm:p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#F7F4EE] border border-[#C2A77A] flex items-center justify-center mx-auto">
                  <SearchX className="w-6 h-6 text-[#C2A77A]" />
                </div>
                <h3 className="font-heading font-extrabold text-lg uppercase tracking-tight text-[#1A1A1A]">
                  Order Not Found
                </h3>
                <p className="text-xs sm:text-sm text-[#666666] font-body max-w-md mx-auto">
                  We couldn't find an order with this ID. Please check your Order ID and try again.
                </p>
                <p className="text-[11px] text-[#666666] font-body max-w-md mx-auto border-t border-[#E5E5E5] pt-3">
                  If you just placed the order, please allow 24 hours for it to sync. Still having trouble?{' '}
                  <a
                    href="https://wa.me/919326184407?text=Salam!%20I%20need%20help%20tracking%20my%20order."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#1A1A1A] underline underline-offset-2"
                  >
                    Contact us on WhatsApp
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Result — Visual Timeline */}
          {order && (
            <div className="mt-6 pt-6 border-t border-[#E5E5E5] space-y-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[11px] font-heading uppercase text-[#666666]">Status for</span>
                  <div className="font-heading font-bold text-xs sm:text-sm text-[#1A1A1A] break-all">
                    {order.order_number ?? order.id}
                  </div>
                </div>
                <span className="ml-3 shrink-0 px-2.5 py-1 bg-[#F7F4EE] border border-[#C2A77A] text-[11px] font-heading font-bold text-[#1A1A1A] uppercase">
                  {currentStep === 3 ? 'DELIVERED' : 'ACTIVE'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {STEPS.map(({ label, Icon }, i) => {
                  const state = i < currentStep ? 'done' : i === currentStep ? 'current' : 'upcoming';
                  const circle =
                    state === 'done'
                      ? 'bg-[#1A1A1A] text-white'
                      : state === 'current'
                        ? 'bg-[#C2A77A] text-[#111111]'
                        : 'bg-[#E5E5E5] text-[#666666]';
                  const text = state === 'upcoming' ? 'text-[#666666]' : 'text-[#1A1A1A]';
                  return (
                    <div
                      key={label}
                      className={`flex flex-col items-center text-center ${state === 'upcoming' ? 'opacity-40' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${circle}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-heading font-bold uppercase ${text}`}>{label}</span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-[#666666] font-body text-center pt-2">
                {currentStep === 3 && 'Your order has been delivered. We hope you love it!'}
                {currentStep === 2 &&
                  (hasTrackingLink
                    ? 'Your order has been dispatched and is on its way.'
                    : 'Your order has been dispatched. Your tracking link will appear here shortly.')}
                {currentStep <= 1 && 'Your order is being prepared and packed.'}
              </p>

              {/* Prominent Track Package button (Dispatched + link available) */}
              {hasTrackingLink && (
                <div className="pt-1">
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[52px] px-8 py-4 bg-[#C2A77A] hover:bg-[#B39665] text-[#111111] font-heading font-bold text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2.5 transition-colors shadow-sm"
                  >
                    <Truck className="w-5 h-5" />
                    <span>Track Package</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Educational Text */}
        <div className="space-y-6 font-body text-[#1A1A1A] leading-relaxed">
          <p className="text-sm sm:text-base text-[#666666]">
            Here is how you can track your package:
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
                2. Processing & Packing
              </div>
              <p className="text-xs text-[#666666]">
                Your order is carefully prepared and packed. This takes 3-5 business days to guarantee zero defects.
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
