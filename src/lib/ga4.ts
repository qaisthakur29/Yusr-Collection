// GA4 e-commerce event tracking.
//
// gtag.js and the inline `gtag()` shim are both defined in index.html's <head>,
// and the shim is synchronous — any call made before gtag.js finishes
// downloading is pushed onto `dataLayer` and replayed once it loads.
//
// The catch is that `window.gtag` exists from the inline shim alone, so the
// optional call below proves nothing about whether gtag.js ever arrived: when
// the script is blocked (ad-blocker, CSP, offline) every event piles up in
// `dataLayer` and is never sent, silently. To make that visible, `track()` also
// arms a 5-second watchdog that reports the failure via `console.error` if
// gtag.js still has not loaded, and reports a missing shim outright.
//
// Nothing here depends on an npm package.

declare global {
  interface Window {
    /** GA4 command queue. The inline snippet in index.html defines it synchronously. */
    gtag?: (...args: unknown[]) => void;
    /** Set by the gtag.js <script> tag in index.html once the library has loaded. */
    __gaLoaded?: boolean;
    /** Set by the gtag.js <script> tag when the library fails to download. */
    __gaError?: boolean;
  }
}

// How long to wait for gtag.js to become live before reporting the failure.
const GA4_READY_TIMEOUT_MS = 5000;
const GA4_READY_POLL_MS = 100;

let hasReportedGa4Failure = false;
let ga4WatchArmed = false;

/** Reports the failure once per session instead of on every dropped event. */
function reportGa4Failure(reason: string): void {
  if (hasReportedGa4Failure) return;
  hasReportedGa4Failure = true;
  console.error(
    `[ga4] ${reason} GA4 events are pushed to dataLayer but never sent — ` +
      'check for an ad-blocker, a CSP/firewall block on googletagmanager.com, or an offline connection.',
  );
}

// Armed once: the failure is reported once, and later events must not spawn
// duplicate timers.
function watchGa4Load(): void {
  if (window.__gaLoaded === true) return;
  if (ga4WatchArmed) return;
  ga4WatchArmed = true;

  const deadline = Date.now() + GA4_READY_TIMEOUT_MS;
  const check = () => {
    if (window.__gaLoaded === true) return;
    if (Date.now() >= deadline) {
      reportGa4Failure(`gtag.js did not load within ${GA4_READY_TIMEOUT_MS / 1000}s.`);
      return;
    }
    window.setTimeout(check, GA4_READY_POLL_MS);
  };
  window.setTimeout(check, GA4_READY_POLL_MS);
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
  const gtag = window.gtag;
  if (typeof gtag !== 'function') {
    reportGa4Failure('window.gtag was never defined (the inline shim is missing or blocked).');
    return;
  }
  // The shim queues this onto dataLayer; gtag.js replays the queue once it loads.
  gtag('event', event, params);
  watchGa4Load();
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
