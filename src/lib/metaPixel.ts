// Meta Pixel event tracking.
//
// The pixel base code lives in index.html as the official snippet Meta provides.
// That snippet assigns `window.fbq` synchronously and queues every call made
// before `fbevents.js` has finished downloading, so `fbq` already exists by the
// time React mounts and early events are buffered rather than lost.
//
// That queueing is also the trap this module guards against. `window.fbq` exists
// as soon as the inline snippet runs, which is *before* `fbevents.js` has been
// downloaded — so the mere presence of `fbq` proves nothing. When the script is
// blocked (ad-blocker, CSP, offline) every event lands on `fbq.queue` and is
// never transmitted, with no error anywhere. `whenPixelReady` therefore fires the
// event as before and arms a 5-second watchdog: if `fbevents.js` still has not
// loaded by then, it reports the failure via `console.error` instead of
// swallowing it. The watchdog is also the only signal available when the inline
// snippet itself was stripped and `fbq` never appeared at all.
//
// Nothing here depends on an npm package.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    /**
     * Set by the pixel base code in index.html once `fbevents.js` has actually
     * finished loading. This — not `window.fbq` — is what proves the pixel is
     * live and the queued events are being sent.
     */
    __fbEventsLoaded?: boolean;
    /** Set by the base code when `fbevents.js` fails to download. */
    __fbEventsError?: boolean;
  }
}

// How long to wait for the pixel to become genuinely live before reporting the
// failure. Long enough to absorb a slow mobile download of `fbevents.js`, short
// enough that a blocked pixel is flagged while the session is still open.
const PIXEL_READY_TIMEOUT_MS = 5000;
const PIXEL_READY_POLL_MS = 100;

type Fbq = (...args: unknown[]) => void;

// True only once `fbevents.js` itself is running — not merely the inline shim.
//
// The `callMethod` fallback covers a stale cached index.html that still has the
// original Meta snippet (without the __fbEventsLoaded hook): that is the
// property fbevents.js defines when it takes over the queue, so it is the one
// internals-based signal that does not rely on our own flag.
function isPixelLive(): boolean {
  if (window.__fbEventsLoaded === true) return true;
  const fbq = window.fbq as { callMethod?: unknown } | undefined;
  return typeof fbq?.callMethod === 'function';
}

let hasReportedPixelFailure = false;
let pixelWatchArmed = false;

/** Reports the failure once per session instead of on every dropped event. */
function reportPixelFailure(reason: string): void {
  if (hasReportedPixelFailure) return;
  hasReportedPixelFailure = true;
  console.error(
    `[metaPixel] ${reason} Meta Pixel events are queued but never sent — ` +
      'check for an ad-blocker, a CSP/firewall block on connect.facebook.net, or an offline connection.',
  );
}

// Starts the load watchdog. Armed once: the failure is reported once, and later
// events must not spawn duplicate timers.
function watchPixelLoad(): void {
  if (isPixelLive() || pixelWatchArmed) return;
  pixelWatchArmed = true;

  const deadline = Date.now() + PIXEL_READY_TIMEOUT_MS;
  const check = () => {
    if (isPixelLive()) return;
    if (Date.now() >= deadline) {
      reportPixelFailure(`fbevents.js did not load within ${PIXEL_READY_TIMEOUT_MS / 1000}s.`);
      return;
    }
    window.setTimeout(check, PIXEL_READY_POLL_MS);
  };
  window.setTimeout(check, PIXEL_READY_POLL_MS);
}

// Runs `fire` with `fbq` as soon as the shim is available (which queues the event
// for replay, exactly as before) and then verifies the pixel actually went live.
// When the shim never appears at all, the same watchdog reports that instead of
// letting the event vanish.
function whenPixelReady(fire: (fbq: Fbq) => void): void {
  const ready = window.fbq;
  if (typeof ready === 'function') {
    fire(ready);
    watchPixelLoad();
    return;
  }

  const deadline = Date.now() + PIXEL_READY_TIMEOUT_MS;
  const poll = () => {
    const fbq = window.fbq;
    if (typeof fbq === 'function') {
      fire(fbq);
      watchPixelLoad();
      return;
    }
    if (Date.now() >= deadline) {
      reportPixelFailure('window.fbq was never defined (the inline base code is missing or blocked).');
      return;
    }
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
