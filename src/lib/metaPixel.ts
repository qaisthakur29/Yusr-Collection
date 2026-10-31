// Meta (Facebook) Pixel tracking for the storefront.
//
// `react-facebook-pixel` injects Meta's official fbevents.js snippet and queues
// every call made before it finishes loading, so the helpers below are safe to
// call at any point in the app's lifetime. Everything becomes a no-op when
// VITE_META_PIXEL_ID is unset — local dev without the variable, or a visitor
// whose ad-blocker stops the script.

import * as PixelModule from 'react-facebook-pixel';

type PixelApi = typeof PixelModule;

// The package's type definitions describe named exports, but the shipped UMD
// bundle only puts the API on `default` (`module.exports.default`). On top of
// that, the `__esModule` wrapper survives a different number of unwraps in dev
// (`vite optimize` emits `export default require_fb_pixel()`, which still holds
// the wrapper) versus a production build (Rollup returns the CJS exports as-is).
// So walk `.default` until the object that actually carries `init` shows up.
function resolvePixelApi(module: unknown): PixelApi {
  let current = module as { init?: unknown; default?: unknown } | null | undefined;

  for (let depth = 0; depth < 3 && current; depth += 1) {
    if (typeof current.init === 'function') return current as unknown as PixelApi;
    current = current.default as typeof current;
  }

  return module as PixelApi;
}

const ReactPixel = resolvePixelApi(PixelModule);

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

let initialised = false;

// Idempotent: StrictMode double-invokes effects and HMR re-runs module bodies.
export function initMetaPixel(): void {
  if (initialised || !PIXEL_ID) return;
  initialised = true;

  // `fbq('init', …)` does not emit a PageView on its own — App.tsx sends the
  // first one on mount, so passing no options here cannot double-count a visit.
  ReactPixel.init(PIXEL_ID);
}

export function trackPageView(): void {
  ReactPixel.pageView();
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
  ReactPixel.track('ViewContent', {
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
  ReactPixel.track('AddToCart', {
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
  ReactPixel.track('InitiateCheckout', {
    content_ids: lines.map((line) => line.id),
    contents: toContents(lines),
    content_type: 'product',
    num_items: lines.reduce((sum, line) => sum + line.quantity, 0),
    currency: CURRENCY,
    value,
  });
}

export function trackPurchase(lines: PixelLine[], value: number): void {
  ReactPixel.track('Purchase', {
    content_ids: lines.map((line) => line.id),
    contents: toContents(lines),
    content_type: 'product',
    num_items: lines.reduce((sum, line) => sum + line.quantity, 0),
    currency: CURRENCY,
    value,
  });
}
