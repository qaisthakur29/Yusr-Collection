// Meta Pixel event tracking.
//
// The pixel base code lives in index.html as the official snippet Meta provides.
// That snippet assigns `window.fbq` synchronously and queues every call made
// before `fbevents.js` has finished downloading, so `fbq` already exists by the
// time React mounts and early events are buffered rather than lost.
//
// `whenPixelReady` is a defensive layer on top of that: if the inline snippet was
// stripped, moved, or blocked (ad-blocker / offline), `window.fbq` can be missing
// when an event fires. Instead of dropping the event, we poll briefly and fire it
// as soon as the pixel appears. If it never appears, the event is dropped
// silently — there is nothing to send it through.
//
// Nothing here depends on an npm package.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// How long to keep looking for `window.fbq` before giving up. The inline snippet
// in <head> runs before this module, so the first check almost always succeeds;
// this only matters when the snippet was blocked, stripped, or deferred.
const PIXEL_READY_TIMEOUT_MS = 8000;
const PIXEL_READY_POLL_MS = 100;

type Fbq = (...args: unknown[]) => void;

// Runs `fire` with `fbq` as soon as the pixel is available.
function whenPixelReady(fire: (fbq: Fbq) => void): void {
  const ready = window.fbq;
  if (typeof ready === 'function') {
    fire(ready);
    return;
  }

  const deadline = Date.now() + PIXEL_READY_TIMEOUT_MS;
  const poll = () => {
    const fbq = window.fbq;
    if (typeof fbq === 'function') {
      fire(fbq);
      return;
    }
    if (Date.now() >= deadline) return; // Pixel blocked: nothing to fire into.
    window.setTimeout(poll, PIXEL_READY_POLL_MS);
  };
  poll();
}

// Queues a standard `fbq('track', ...)` call once the pixel is ready.
function track(event: string, params?: Record<string, unknown>): void {
  whenPixelReady((fbq) => {
    if (params === undefined) fbq('track', event);
    else fbq('track', event, params);
  });
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

// Only for SPA route changes. The base code in index.html already sends the
// PageView for the initial load, so App.tsx skips it on mount and calls this for
// every navigation after that.
export function trackPageView(): void {
  track('PageView');
}

export function trackViewContent(product: { id: string; name: string; price: number }): void {
  track('ViewContent', {
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
  track('AddToCart', {
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
  track('InitiateCheckout', {
    content_ids: lines.map((line) => line.id),
    contents: toContents(lines),
    content_type: 'product',
    num_items: lines.reduce((sum, line) => sum + line.quantity, 0),
    currency: CURRENCY,
    value,
  });
}

export function trackPurchase(lines: PixelLine[], value: number): void {
  track('Purchase', {
    content_ids: lines.map((line) => line.id),
    contents: toContents(lines),
    content_type: 'product',
    num_items: lines.reduce((sum, line) => sum + line.quantity, 0),
    currency: CURRENCY,
    value,
  });
}
