// GA4 e-commerce event tracking.
//
// gtag.js and the inline `gtag()` shim are both defined in index.html's <head>,
// and the shim is synchronous — any call made before gtag.js finishes
// downloading is pushed onto `dataLayer` and replayed once it loads. Unlike the
// Meta Pixel there is therefore no ready-check to perform here: the optional
// call simply no-ops if the snippet was stripped or an ad-blocker stopped it.
//
// Nothing here depends on an npm package.

declare global {
  interface Window {
    /** GA4 command queue. The inline snippet in index.html defines it synchronously. */
    gtag?: (...args: unknown[]) => void;
  }
}

const CURRENCY = 'INR';

// Same shape as the Meta Pixel line, declared structurally so this module stays
// independent of metaPixel.ts while still accepting the array callers already build.
interface Ga4Line {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

function toItems(lines: Ga4Line[]) {
  return lines.map((line) => ({
    item_id: line.id,
    item_name: line.name,
    price: line.price,
    quantity: line.quantity,
  }));
}

function track(event: string, params: Record<string, unknown>): void {
  window.gtag?.('event', event, params);
}

export function trackGa4AddToCart(
  product: { id: string; name: string; price: number },
  quantity = 1,
): void {
  track('add_to_cart', {
    currency: CURRENCY,
    value: product.price * quantity,
    items: toItems([
      { id: product.id, name: product.name, price: product.price, quantity },
    ]),
  });
}

export function trackGa4BeginCheckout(lines: Ga4Line[], value: number): void {
  track('begin_checkout', {
    currency: CURRENCY,
    value,
    items: toItems(lines),
  });
}

// `transactionId` is the Supabase order id, which is what makes GA4 deduplicate
// a repeated `purchase` for the same order.
export function trackGa4Purchase(
  lines: Ga4Line[],
  value: number,
  transactionId: string,
): void {
  track('purchase', {
    transaction_id: transactionId,
    currency: CURRENCY,
    value,
    items: toItems(lines),
  });
}
