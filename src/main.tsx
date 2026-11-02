import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { fetchProductsFromDB } from './data/products';
import './index.css';

// A new deploy replaces the hashed route chunks, so a visitor who still has the
// previous build open can fail to fetch a lazy chunk and be left on a blank
// page. Recover with a single reload — the cart lives in localStorage, so it
// survives. The sessionStorage flag stops a reload loop if a chunk is genuinely
// unavailable, and is cleared as soon as the app boots successfully.
window.addEventListener('vite:preloadError', () => {
  try {
    if (sessionStorage.getItem('yusr_chunk_reload')) return;
    sessionStorage.setItem('yusr_chunk_reload', '1');
  } catch {
    // Storage blocked (e.g. strict privacy mode): fall through to the reload.
  }
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(<App />);

try {
  sessionStorage.removeItem('yusr_chunk_reload');
} catch {
  // Ignore: the guard simply stays in place for this session.
}

// Warm the Shop route as soon as the browser is idle, so the catalog is already
// cached (JS chunk + product data) by the time the visitor clicks "Shop".
const prefetchShop = () => {
  void import('./pages/ShopPage');
  void fetchProductsFromDB({ limit: 10 });
};

if (typeof requestIdleCallback === 'function') {
  requestIdleCallback(prefetchShop, { timeout: 3000 });
} else {
  window.setTimeout(prefetchShop, 2000);
}
