import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Check, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabaseClient';
import { optimizeImage } from '../lib/image';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    subtotal,
    clearCart,
  } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'prepaid', // 'prepaid' | 'cod'
  });

  if (!isOpen) return null;

  const isPrepaid = formData.paymentMethod === 'prepaid';
  const prepaidDiscount = isPrepaid ? 50 : 0;
  const orderTotal = Math.max(0, subtotal - prepaidDiscount);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address || !formData.pincode) {
      alert('Please fill in all required shipping fields.');
      return;
    }

    const fullAddress = [formData.address, formData.city, formData.state, formData.pincode]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(', ');

    const orderItemsSummary = items
      .map((i) => `• ${i.product.name} (Size: ${i.size}, Qty: ${i.quantity}) - ₹${i.product.price * i.quantity}`)
      .join('\n');

    const openWhatsApp = (orderId: string, paymentId?: string) => {
      const msg = `Salam! I would like to place an order on Yusr Collection:

📦 *Order ID:* ${orderId}
👤 *Name:* ${formData.name}
📞 *Phone:* ${formData.phone}
📍 *Address:* ${fullAddress}
💳 *Payment:* ${isPrepaid ? 'Prepaid (UPI / NetBanking - ₹50 Off)' : 'Cash on Delivery (COD)'}${paymentId ? `\n🧾 *Razorpay Payment ID:* ${paymentId}` : ''}

🛍️ *Items:*
${orderItemsSummary}

💰 *Total Amount:* ₹${orderTotal}

Please confirm my order and share payment/tracking details. Alhamdulillah!`;

      window.open(`https://wa.me/919326184407?text=${encodeURIComponent(msg)}`, '_blank');
    };

    setPlacingOrder(true);
    setCheckoutError(null);

    // ---------- COD: save the order first, then hand off to WhatsApp ----------
    if (!isPrepaid) {
      // The anon role may INSERT but not read rows back (there is no SELECT policy),
      // so the id is generated client-side and `.select()` is deliberately omitted.
      const orderId = crypto.randomUUID();

      const { error: insertError } = await supabase.from('orders').insert({
        id: orderId,
        customer_name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: fullAddress,
        total_amount: orderTotal,
        status: 'Pending',
        payment_method: 'COD',
      });

      setPlacingOrder(false);

      if (insertError) {
        setCheckoutError(insertError.message || 'Could not save this order. Please try again.');
        return;
      }

      setOrderSuccess(true);
      setTimeout(() => {
        openWhatsApp(orderId);
        clearCart();
      }, 1500);
      return;
    }

    // ---------- Prepaid: create the Razorpay order, save only after payment succeeds ----------
    // DB prices are numeric and can be fractional, but the Edge Function only
    // accepts an integer rupee amount.
    const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
      body: { amount: Math.round(orderTotal) },
    });

    if (error || !data) {
      setCheckoutError(error?.message || 'Could not start the payment. Please try again.');
      setPlacingOrder(false);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: data.amount,
      currency: 'INR',
      name: 'Yusr Collection',
      description: 'Premium Streetwear',
      order_id: data.order_id,
      prefill: {
        name: formData.name,
        contact: formData.phone,
        email: formData.email || '',
      },
      theme: { color: '#C2A77A' },
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        // Never trust the browser for payment status: the Edge Function verifies
        // the HMAC signature and writes the order itself.
        const { data: verified, error: verifyError } = await supabase.functions.invoke(
          'verify-razorpay-payment',
          {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              customer_name: formData.name.trim(),
              phone: formData.phone.trim(),
              email: formData.email.trim(),
              address: fullAddress,
            },
          },
        );

        setPlacingOrder(false);

        if (verifyError || !verified?.success || !verified?.order_id) {
          setCheckoutError(
            'We could not verify your payment. If money was deducted, please contact us on WhatsApp.',
          );
          return;
        }

        setOrderSuccess(true);
        setTimeout(() => {
          openWhatsApp(verified.order_id, response.razorpay_payment_id);
          clearCart();
        }, 1500);
      },
      modal: {
        ondismiss: function () {
          setPlacingOrder(false); // Stop loading state if user cancels
          setCheckoutError('Payment cancelled. You can try again.');
        },
      },
    };

    // checkout.js is loaded from a CDN, so ad-blockers or a network failure can
    // leave window.Razorpay undefined. Without this guard the submit button
    // would stay stuck on its loading state forever.
    if (typeof window.Razorpay !== 'function') {
      setCheckoutError('Payment gateway blocked by browser. Please disable ad-blockers.');
      setPlacingOrder(false);
      return;
    }

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setCheckoutError('Payment gateway blocked by browser. Please disable ad-blockers.');
      setPlacingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-xs"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white text-[#1A1A1A] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E5E5E5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#1A1A1A]" />
              <h2 className="font-heading font-bold text-base tracking-[0.05em] uppercase text-[#1A1A1A]">
                YOUR CART ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 text-[#666666] hover:text-[#1A1A1A] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Content */}
          {orderSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#C2A77A]/20 flex items-center justify-center text-[#111111] mb-4">
                <Check className="w-8 h-8 text-[#111111]" />
              </div>
              <h3 className="font-heading font-bold text-xl uppercase mb-2">Alhamdulillah! Order Initiated</h3>
              <p className="text-sm text-[#666666] mb-6 font-body">
                We are opening WhatsApp with your order details so our team can immediately confirm printing and dispatch.
              </p>
              <button
                onClick={() => {
                  setOrderSuccess(false);
                  setIsCheckingOut(false);
                  closeCart();
                }}
                className="w-full min-h-[44px] py-3 bg-[#C2A77A] text-[#111111] font-heading font-bold text-sm uppercase tracking-wide"
              >
                Continue Shopping
              </button>
            </div>
          ) : isCheckingOut ? (
            /* Checkout Form */
            <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                <h3 className="font-heading font-bold text-sm uppercase tracking-wide">Shipping & Contact</h3>
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="text-xs text-[#666666] underline hover:text-[#1A1A1A]"
                >
                  Back to items
                </button>
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zaid Khan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C2A77A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-heading font-semibold uppercase mb-1">WhatsApp Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C2A77A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-semibold uppercase mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C2A77A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold uppercase mb-1">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="House/Flat No., Building, Street Name"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C2A77A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-heading font-semibold uppercase mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mumbai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full min-h-[44px] px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C2A77A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-semibold uppercase mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="MH"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full min-h-[44px] px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C2A77A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-semibold uppercase mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    placeholder="400001"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full min-h-[44px] px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C2A77A]"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="pt-2">
                <label className="block text-xs font-heading font-semibold uppercase mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex flex-col p-3 border cursor-pointer transition-all ${
                      formData.paymentMethod === 'prepaid'
                        ? 'border-[#C2A77A] bg-[#F7F4EE]'
                        : 'border-[#E5E5E5]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="prepaid"
                        checked={formData.paymentMethod === 'prepaid'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'prepaid' })}
                        className="accent-[#C2A77A]"
                      />
                      <span className="font-heading font-bold text-xs uppercase">UPI / Prepaid</span>
                    </div>
                    <span className="text-[11px] text-[#1A1A1A] mt-1.5 font-heading font-medium leading-relaxed">
                      🎁 ₹50 OFF auto-applied
                    </span>
                    <span className="text-[11px] text-[#666666] mt-0.5">Fast dispatch</span>
                  </label>

                  <label
                    className={`flex flex-col p-3 border cursor-pointer transition-all ${
                      formData.paymentMethod === 'cod'
                        ? 'border-[#C2A77A] bg-[#F7F4EE]'
                        : 'border-[#E5E5E5]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                        className="accent-[#C2A77A]"
                      />
                      <span className="font-heading font-bold text-xs uppercase">COD</span>
                    </div>
                    <span className="text-[11px] text-[#666666] mt-1">Pay on delivery</span>
                  </label>
                </div>
              </div>

              {/* Order Summary box */}
              <div className="p-3 bg-[#F9F9F9] border border-[#E5E5E5] text-xs space-y-1.5 font-body">
                <div className="flex justify-between">
                  <span className="text-[#666666]">Items Total</span>
                  <span className="font-semibold tabular-nums">₹{subtotal}</span>
                </div>
                {isPrepaid && (
                  <div className="flex justify-between text-[#1A1A1A] font-semibold">
                    <span>Prepaid Discount</span>
                    <span className="tabular-nums text-emerald-700">-₹{prepaidDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#666666]">Shipping</span>
                  <span className="text-emerald-700 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E5E5E5] font-heading font-bold text-sm">
                  <span>Grand Total</span>
                  <span className="tabular-nums">₹{orderTotal}</span>
                </div>
              </div>

              {checkoutError && (
                <p className="text-xs text-red-600 font-body" role="alert">
                  {checkoutError}
                </p>
              )}

              <button
                type="submit"
                disabled={placingOrder}
                className="w-full min-h-[48px] py-3.5 bg-[#C2A77A] hover:bg-[#B39665] text-[#111111] font-heading font-bold text-sm uppercase tracking-wide transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                <span>{placingOrder ? 'SAVING ORDER…' : 'CONFIRM & PLACE ORDER'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#666666]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Secure Checkout via WhatsApp Fulfillment</span>
              </div>
            </form>
          ) : items.length === 0 ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <ShoppingBag className="w-12 h-12 text-[#E5E5E5] mb-3 stroke-[1.2]" />
              <p className="font-heading font-bold text-sm uppercase tracking-wide mb-1">Your cart is empty</p>
              <p className="text-xs text-[#666666] mb-6 max-w-[220px]">
                Discover our signature drops crafted for ease and legacy.
              </p>
              <button
                onClick={closeCart}
                className="min-h-[44px] px-6 py-2.5 bg-[#1A1A1A] text-white font-heading font-semibold text-xs uppercase tracking-wide"
              >
                Explore Collection
              </button>
            </div>
          ) : (
            /* Item list */
            <>
              <div className="flex-1 overflow-y-auto divide-y divide-[#E5E5E5] p-6 space-y-4">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="pt-4 first:pt-0 flex gap-4">
                    <img
                      src={optimizeImage(item.product.image, 200)}
                      alt={item.product.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-20 h-24 object-cover bg-[#F8F8F8] shrink-0 border border-[#E5E5E5]"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-heading font-bold text-xs uppercase tracking-[0.02em] text-[#1A1A1A] truncate">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.size)}
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center -mr-2 text-[#666666] hover:text-[#1A1A1A]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-[#666666] mt-0.5">
                          Size: <span className="font-semibold text-[#1A1A1A]">{item.size}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="font-heading font-bold text-sm text-[#1A1A1A] tabular-nums">
                            ₹{item.product.price}
                          </span>
                          <span className="text-xs text-[#666666] line-through tabular-nums">
                            ₹{item.product.mrp}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center border border-[#E5E5E5]">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[#1A1A1A] hover:bg-neutral-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[#1A1A1A] hover:bg-neutral-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs text-[#666666] tabular-nums">
                          Total: ₹{item.product.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary (No Promo Code Box) */}
              <div className="border-t border-[#E5E5E5] p-6 bg-[#FBFBFB] space-y-4">
                <div className="space-y-1.5 text-xs text-[#666666] font-body">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-[#1A1A1A] font-medium tabular-nums">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-[#1A1A1A] font-medium">Calculated at next step (FREE Pan-India)</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#E5E5E5] font-heading font-bold text-base text-[#1A1A1A]">
                    <span>ESTIMATED TOTAL</span>
                    <span className="tabular-nums">₹{subtotal}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckingOut(true)}
                  className="w-full min-h-[48px] py-3.5 bg-[#C2A77A] hover:bg-[#B39665] text-[#111111] font-heading font-bold text-sm uppercase tracking-[0.05em] transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}