// Meta Pixel event tracking.
//
// The pixel base code lives in index.html as the official snippet Meta provides,
// so it runs before the React bundle and `window.fbq` exists from the first line
// of app code. Nothing here depends on an npm package.
//
// `fbq` queues calls made before fbevents.js finishes downloading, so every
// helper below is safe to call at any point in the app's lifetime. They are all
// no-ops when the snippet never ran (ad-blocker, offline, or a non-HTML entry).

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function fbq(...args: unknown[]): void {
  window.fbq?.(...args);
}

// Only for SPA route changes. The base code in index.html already sends the
// PageView for the initial load, so firing here on mount would count it twice.
export function trackPageView(): void {
  fbq('track', 'PageView');
}

export interface PixelLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const CURRENCY = 'INR';

function toContents(lines: PixelLine[]) {
  return lines.map((line) => ({
    id: line.id,
    quantity: line.quantity,
    item_price: line.price,
  }));
}

export function trackViewContent(product: { id: string; name: string; price: number }): void {
  fbq('track', 'ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    currency: CURRENCY,
    value: product.price,
  });
}

export function trackAddToCart(
  product: { id: string; name: string; price: number },
  quantity = 1,
): void {
  fbq('track', 'AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    contents: toContents([
      { id: product.id, name: product.name, price: product.price, quantity },
    ]),
    currency: CURRENCY,
    value: product.price * quantity,
  });
}

export function trackInitiateCheckout(lines: PixelLine[], value: number): void {
  fbq('track', 'InitiateCheckout', {
    content_ids: lines.map((line) => line.id),
    contents: toContents(lines),
    content_type: 'product',
    num_items: lines.reduce((sum, line) => sum + line.quantity, 0),
    currency: CURRENCY,
    value,
  });
}

export function trackPurchase(lines: PixelLine[], value: number): void {
  fbq('track', 'Purchase', {
    content_ids: lines.map((line) => line.id),
    contents: toContents(lines),
    content_type: 'product',
    num_items: lines.reduce((sum, line) => sum + line.quantity, 0),
    currency: CURRENCY,
    value,
  });
}
