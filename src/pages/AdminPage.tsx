import React, { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, LogOut, Package, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  subname: string | null;
  price: number;
  mrp: number;
  image: string;
  gallery: string[] | null;
  sizes: string[];
  description: string;
  category: string;
  fabric: string;
  fit: string;
  details: string[];
  size_guide_url: string | null;
  sort_order: number;
  is_active: boolean;
};

type AdminOrder = {
  id: string;
  order_number: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  total_amount: number | string;
  status: string;
  payment_method: string | null;
  razorpay_payment_id: string | null;
  tracking_url: string | null;
  created_at: string;
};

type AdminTab = 'dashboard' | 'products' | 'orders';

const NAV_ITEMS: { id: AdminTab; label: string; Icon: typeof Package }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'products', label: 'Products', Icon: Package },
  { id: 'orders', label: 'Orders', Icon: ShoppingCart },
];

const emptyForm = {
  name: '',
  slug: '',
  subname: '',
  price: '',
  mrp: '',
  image: '',
  gallery: '',
  sizes: 'S,M,L,XL,XXL',
  description: '',
  category: '',
  fabric: '',
  fit: '',
  details: '',
  size_guide_url: '',
  sort_order: '0',
  is_active: true,
};

function splitCsv(value: string): string[] {
  return value.split(',').map((part) => part.trim()).filter(Boolean);
}

// `functions.invoke` swallows the real reason behind a generic
// "Failed to send a request to the Edge Function" string, which makes a bad
// payload indistinguishable from a CORS/network failure. Unpack it:
//   - FunctionsHttpError  -> non-2xx; the JSON body is in `error.context` (a Response)
//   - FunctionsFetchError -> fetch() itself rejected (offline, blocked, CORS preflight)
//   - FunctionsRelayError -> the Supabase relay refused the call
async function functionErrorMessage(error: unknown, data: unknown): Promise<string> {
  console.error('Edge Function call failed', { error, data });

  // A 2xx response that still carries an application-level error.
  const embedded = (data as { error?: unknown } | null)?.error;
  if (typeof embedded === 'string' && embedded) return embedded;

  if (!error) return 'Unexpected Edge Function error';

  const name = (error as { name?: string }).name ?? '';
  const context = (error as { context?: unknown }).context;

  if (context instanceof Response) {
    const raw = await context.text().catch(() => '');
    let detail = raw;
    try {
      const body = JSON.parse(raw) as { error?: unknown; message?: unknown };
      const message = body?.error ?? body?.message;
      if (typeof message === 'string' && message) detail = message;
    } catch {
      // Not JSON — fall back to the raw body text.
    }

    const seen = detail.trim().slice(0, 300);
    return seen
      ? `Edge Function returned ${context.status}: ${seen}`
      : `Edge Function returned ${context.status}`;
  }

  if (name === 'FunctionsFetchError') {
    return 'Could not reach the Edge Function — the request never left the browser (offline, blocked, or a CORS preflight failure). Check the browser console and network tab.';
  }

  const message = (error as { message?: string }).message;
  return message || 'Unexpected Edge Function error';
}

type GateState = 'checking' | 'locked' | 'granted';

export function AdminPage() {
  const [gate, setGate] = useState<GateState>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [trackingUrlInput, setTrackingUrlInput] = useState('');

  // Custom Category States
  const [categories, setCategories] = useState(['Tees', 'Hoodies']);
  const [newCategory, setNewCategory] = useState('');

  // Restore an existing Supabase Auth session on mount, and react to sign in/out.
  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setGate(data.session ? 'granted' : 'locked');
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setGate(session ? 'granted' : 'locked');
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setLoginError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSigningIn(false);
    if (signInError) {
      setLoginError(signInError.message);
      return;
    }

    setPassword('');
    // onAuthStateChange flips the gate once the session is established.
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProducts([]);
    setOrders([]);
    setStatus(null);
    setError(null);
  };

  const fetchProducts = useCallback(async () => {
    // Mirror the storefront ordering so the Sort Order column reads top-to-bottom.
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setProducts((data as AdminProduct[]) ?? []);
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke('get-admin-orders', {
      body: { action: 'list' },
    });

    setOrdersLoading(false);
    if (fnError || data?.error) {
      setError(await functionErrorMessage(fnError, data));
      return;
    }
    setOrders((data?.orders as AdminOrder[]) ?? []);
  }, []);

  useEffect(() => {
    if (gate === 'granted') void fetchProducts();
  }, [gate, fetchProducts]);

  // Orders are needed both by the Orders view and by the Dashboard counters.
  useEffect(() => {
    if (gate === 'granted' && (activeTab === 'orders' || activeTab === 'dashboard')) {
      void fetchOrders();
    }
  }, [gate, activeTab, fetchOrders]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setForm({ ...form, category: trimmed });
      setNewCategory('');
    }
  };

  const handleEdit = (product: AdminProduct) => {
    setError(null);
    setStatus(null);
    setEditingId(product.id);
    // Agar product ki category list mein nahi hai, toh use add karo
    if (product.category && !categories.includes(product.category)) {
      setCategories((prev) => [...prev, product.category]);
    }
    setForm({
      name: product.name,
      slug: product.slug,
      subname: product.subname ?? '',
      price: String(product.price),
      mrp: String(product.mrp),
      image: product.image,
      gallery: (product.gallery ?? []).join(', '),
      sizes: (product.sizes ?? []).join(','),
      description: product.description,
      category: product.category,
      fabric: product.fabric,
      fit: product.fit,
      details: (product.details ?? []).join(', '),
      size_guide_url: product.size_guide_url ?? '',
      sort_order: String(product.sort_order ?? 0),
      is_active: product.is_active ?? true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setStatus(null);

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      subname: form.subname.trim() || null,
      price: Number(form.price),
      mrp: Number(form.mrp),
      image: form.image.trim(),
      gallery: splitCsv(form.gallery),
      sizes: splitCsv(form.sizes),
      description: form.description.trim(),
      category: form.category.trim(),
      fabric: form.fabric.trim(),
      fit: form.fit.trim(),
      details: splitCsv(form.details),
      size_guide_url: form.size_guide_url.trim() || null,
      sort_order: Math.trunc(Number(form.sort_order) || 0),
      is_active: form.is_active,
    };

    const { data: saveResult, error: saveError } = await supabase.functions.invoke('manage-products', {
      body: {
        action: editingId ? 'update' : 'create',
        id: editingId ?? undefined,
        product: payload,
      },
    });

    setSaving(false);
    if (saveError || saveResult?.error) {
      return setError(await functionErrorMessage(saveError, saveResult));
    }

    setStatus(editingId ? `Updated ${payload.name}` : `Added ${payload.name}`);
    resetForm();
    await fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const { data, error: fnError } = await supabase.functions.invoke('manage-products', {
      body: { action: 'delete', id },
    });
    if (fnError || data?.error) return setError(await functionErrorMessage(fnError, data));
    setStatus('Product deleted');
    await fetchProducts();
  };

  // Quick Hide/Show straight from the list: patches only is_active so the rest of
  // the row is untouched, and no full edit form is needed.
  const handleToggleActive = async (product: AdminProduct) => {
    const nextActive = !product.is_active;
    setTogglingId(product.id);
    setError(null);
    setStatus(null);

    const { data, error: fnError } = await supabase.functions.invoke('manage-products', {
      body: { action: 'update', id: product.id, product: { is_active: nextActive } },
    });

    setTogglingId(null);
    if (fnError || data?.error) return setError(await functionErrorMessage(fnError, data));

    setStatus(nextActive ? `${product.name} is now visible on the storefront` : `${product.name} is now hidden`);
    await fetchProducts();
  };

  const handleDispatch = async (id: string, trackingUrl?: string) => {
    // Couriers often hand out bare links ("delhivery.com/track/123"). Assume https
    // so a missing scheme never silently fails the Edge Function's URL validation.
    let url = (trackingUrl ?? '').trim();
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;

    setDispatchingId(id);
    setError(null);
    setStatus(null);
    const { data, error: fnError } = await supabase.functions.invoke('get-admin-orders', {
      body: { action: 'dispatch', id, tracking_url: url },
    });
    setDispatchingId(null);
    if (fnError || data?.error) return setError(await functionErrorMessage(fnError, data));
    setStatus('Order marked as dispatched');
    setSelectedOrder(null);
    setTrackingUrlInput('');
    await fetchOrders();
  };

  const handleDeliver = async (id: string) => {
    setDeliveringId(id);
    const { data, error: fnError } = await supabase.functions.invoke('get-admin-orders', {
      body: { action: 'deliver', id },
    });
    setDeliveringId(null);
    if (fnError || data?.error) return setError(await functionErrorMessage(fnError, data));
    setStatus('Order marked as delivered');
    setSelectedOrder(null);
    await fetchOrders();
  };

  const openOrderDetails = (order: AdminOrder) => {
    setError(null);
    setStatus(null);
    setTrackingUrlInput(order.tracking_url ?? '');
    setSelectedOrder(order);
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Delete this order permanently?")) return;
    setDeletingOrderId(id);
    const { data, error: fnError } = await supabase.functions.invoke('get-admin-orders', {
      body: { action: 'delete', id },
    });
    setDeletingOrderId(null);
    if (fnError || data?.error) return setError(await functionErrorMessage(fnError, data));
    setStatus('Order deleted');
    await fetchOrders();
  };

  if (gate === 'checking') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm uppercase tracking-widest text-gray-400">
        Checking session…
      </div>
    );
  }

  if (gate === 'locked') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <h1 className="font-heading font-extrabold text-3xl uppercase tracking-tight text-center">Admin</h1>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="username"
            required
            className="w-full min-h-[44px] px-3.5 border border-[#E5E5E5] focus:outline-none focus:border-[#C2A77A]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            className="w-full min-h-[44px] px-3.5 border border-[#E5E5E5] focus:outline-none focus:border-[#C2A77A]"
          />
          {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
          <button
            type="submit"
            disabled={signingIn}
            className="w-full min-h-[44px] bg-[#1A1A1A] text-white font-bold uppercase disabled:opacity-50"
          >
            {signingIn ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F9F9F9]">
      <aside className="w-64 shrink-0 h-full bg-white border-r border-[#E5E5E5] flex flex-col">
        <div className="px-6 py-6 border-b border-[#E5E5E5]">
          <h1 className="font-heading font-extrabold text-lg uppercase tracking-tight">YUSR ADMIN</h1>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold border-l-2 transition-colors ${
                  active
                    ? 'bg-[#1A1A1A] text-white border-[#C2A77A]'
                    : 'border-transparent text-[#555555] hover:bg-[#F9F9F9] hover:text-[#1A1A1A]'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#E5E5E5]">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-[#555555] hover:bg-[#F9F9F9] hover:text-[#1A1A1A]"
          >
            <LogOut size={18} strokeWidth={1.75} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto p-8">
        {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}
        {status && <p className="mb-4 text-green-700 text-sm">{status}</p>}

        {activeTab === 'dashboard' && (
          <div>
            <h2 className="font-heading font-extrabold text-2xl uppercase mb-1">Dashboard</h2>
            <p className="text-sm text-[#666666] mb-8">Welcome back to Yusr Collection.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="bg-white border border-[#E5E5E5] p-6">
                <div className="flex items-center gap-2 text-[#666666] mb-3">
                  <Package size={16} strokeWidth={1.75} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Products</span>
                </div>
                <p className="font-heading font-extrabold text-3xl tabular-nums">{products.length}</p>
              </div>

              <div className="bg-white border border-[#E5E5E5] p-6">
                <div className="flex items-center gap-2 text-[#666666] mb-3">
                  <ShoppingCart size={16} strokeWidth={1.75} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
                </div>
                <p className="font-heading font-extrabold text-3xl tabular-nums">
                  {ordersLoading ? '—' : orders.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="overflow-x-auto border border-[#E5E5E5] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FBFBFB] uppercase text-xs">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading && (
                  <tr><td colSpan={7} className="p-3 text-center text-gray-500">Loading orders…</td></tr>
                )}
                {!ordersLoading && orders.length === 0 && (
                  <tr><td colSpan={7} className="p-3 text-center text-gray-500">No orders yet.</td></tr>
                )}
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-[#E5E5E5]">
                    <td className="p-3 font-semibold whitespace-nowrap">{o.order_number ?? '—'}</td>
                    <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-3">{o.customer_name} <br/><span className="text-xs text-gray-500">{o.phone}</span></td>
                    <td className="p-3 font-semibold">₹{o.total_amount}</td>
                    <td className="p-3 text-xs uppercase font-bold">{o.payment_method ?? '—'}</td>
                    <td className="p-3 uppercase text-xs font-bold">{o.status}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openOrderDetails(o)} className="px-3 py-1 border text-xs uppercase">View Details</button>
                        {o.status !== 'Dispatched' && o.status !== 'Delivered' && (
                          <button onClick={() => openOrderDetails(o)} className="px-3 py-1 border text-xs uppercase">Mark Dispatched</button>
                        )}
                        {o.status === 'Dispatched' && (
                          <button
                            onClick={() => handleDeliver(o.id)}
                            disabled={deliveringId === o.id}
                            className="px-3 py-1 border text-xs uppercase disabled:opacity-40"
                          >
                            {deliveringId === o.id ? 'Saving…' : 'Mark Delivered'}
                          </button>
                        )}
                        <button onClick={() => handleDeleteOrder(o.id)} className="px-3 py-1 border text-red-600 text-xs uppercase">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'products' && (
          <>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 p-6 border border-[#E5E5E5] bg-white">
              
              <Field label="Name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></Field>
              <Field label="Slug"><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} /></Field>
              <Field label="Subname"><input value={form.subname} onChange={(e) => setForm({ ...form, subname: e.target.value })} className={inputClass} /></Field>
              
              {/* UPDATED CATEGORY FIELD */}
              <Field label="Category">
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputClass}
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="New category name..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 min-h-[36px] px-3 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C2A77A]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="min-h-[36px] px-3 bg-[#1A1A1A] text-white font-bold text-[10px] uppercase tracking-wider"
                  >
                    + Add
                  </button>
                </div>
              </Field>

              <Field label="Price"><input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} /></Field>
              <Field label="MRP"><input required type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} className={inputClass} /></Field>
              <Field label="Sort Order (Position)">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  className={inputClass}
                  placeholder="1 = Top, 2 = Second…"
                />
              </Field>

              <Field label="Visible on Storefront">
                <label className="flex items-center gap-2.5 min-h-[44px] px-3.5 border border-[#E5E5E5] text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#C2A77A]"
                  />
                  <span>{form.is_active ? 'Active — visible to customers' : 'Hidden — draft only'}</span>
                </label>
              </Field>
              
              <Field label="Image (URL)" className="sm:col-span-2"><input required value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={inputClass} /></Field>
              <Field label="Gallery Image URLs (Comma Separated)" className="sm:col-span-2"><textarea rows={2} value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })} className={inputClass} /></Field>
              <Field label="Size Guide Image URL" className="sm:col-span-2"><input value={form.size_guide_url} onChange={(e) => setForm({ ...form, size_guide_url: e.target.value })} className={inputClass} /></Field>
              <Field label="Sizes (comma separated)" className="sm:col-span-2"><input required value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className={inputClass} /></Field>
              
              <Field label="Fabric"><input required value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} className={inputClass} /></Field>
              <Field label="Fit"><input required value={form.fit} onChange={(e) => setForm({ ...form, fit: e.target.value })} className={inputClass} /></Field>
              <Field label="Description" className="sm:col-span-2"><textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} /></Field>
              <Field label="Details (comma separated)" className="sm:col-span-2"><textarea required rows={2} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} className={inputClass} /></Field>

              <div className="sm:col-span-2 flex items-center gap-3">
                <button type="submit" disabled={saving} className="min-h-[44px] px-6 bg-[#1A1A1A] text-white font-bold text-xs uppercase tracking-wider">
                  {saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                </button>
                {editingId && <button type="button" onClick={resetForm} className="min-h-[44px] px-4 text-xs border hover:text-black">Cancel</button>}
              </div>
            </form>

            <div className="overflow-x-auto border border-[#E5E5E5] bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FBFBFB] uppercase text-xs">
                  <tr><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Sort Order</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-[#E5E5E5]">
                      <td className="p-3">{p.name}</td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3">₹{p.price}</td>
                      <td className="p-3 tabular-nums">{p.sort_order}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              p.is_active ? 'bg-green-100 text-green-800' : 'bg-[#EEEEEE] text-[#666666]'
                            }`}
                          >
                            {p.is_active ? 'Active' : 'Hidden'}
                          </span>
                          <button
                            onClick={() => void handleToggleActive(p)}
                            disabled={togglingId === p.id}
                            className="px-3 py-1 border text-xs uppercase hover:border-black disabled:opacity-40"
                          >
                            {togglingId === p.id ? 'Saving…' : p.is_active ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right flex justify-end gap-2">
                        <button onClick={() => handleEdit(p)} className="px-3 py-1 border text-xs uppercase hover:border-black">Edit</button>
                        <button onClick={() => handleDelete(p.id)} className="px-3 py-1 border text-red-600 text-xs uppercase hover:bg-red-50">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#E5E5E5]">
              <h2 className="font-heading font-extrabold uppercase text-lg">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1 border border-[#E5E5E5] text-xs uppercase"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div className="bg-[#F7F4EE] border border-[#C2A77A] px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">Order ID</div>
                <div className="font-heading font-extrabold text-lg text-[#1A1A1A] break-all">
                  {selectedOrder.order_number ?? '—'}
                </div>
              </div>
              <Detail label="Internal ID" value={selectedOrder.id} />
              <Detail label="Date" value={new Date(selectedOrder.created_at).toLocaleString()} />
              <Detail label="Name" value={selectedOrder.customer_name} />
              <Detail label="Phone" value={selectedOrder.phone} />
              <Detail label="Email" value={selectedOrder.email} />
              <Detail label="Full Address" value={selectedOrder.address} />
              <Detail label="Total Amount" value={`₹${selectedOrder.total_amount}`} />
              <Detail label="Payment Method" value={selectedOrder.payment_method} />
              <Detail label="Status" value={selectedOrder.status} />
              <Detail label="Tracking URL" value={selectedOrder.tracking_url} />
              <Detail label="Razorpay Payment ID" value={selectedOrder.razorpay_payment_id} />
            </div>

            <div className="px-4 pb-4 space-y-2">
              <Field label="Tracking URL (Courier Link)">
                <input
                  type="url"
                  value={trackingUrlInput}
                  onChange={(e) => setTrackingUrlInput(e.target.value)}
                  placeholder="https://courier.com/track/..."
                  className={inputClass}
                />
              </Field>
              <p className="text-[11px] text-gray-500">
                Paste the courier tracking link, then click “Mark Dispatched”. It powers the “Track Package”
                button on the customer’s tracking page. Already dispatched? Paste the link and click “Save Tracking Link”.
              </p>
            </div>

            {/* Feedback must live inside the modal: the page-level banner renders
                behind this overlay, so a failed save would otherwise look silent. */}
            {error && (
              <p className="mx-4 mb-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2 p-4 border-t border-[#E5E5E5]">
              {selectedOrder.status !== 'Delivered' && (
                <button
                  onClick={() => void handleDispatch(selectedOrder.id, trackingUrlInput.trim())}
                  disabled={dispatchingId === selectedOrder.id || (selectedOrder.status === 'Dispatched' && !trackingUrlInput.trim())}
                  className="px-4 py-2 bg-[#1A1A1A] text-white text-xs uppercase font-bold disabled:opacity-40"
                >
                  {dispatchingId === selectedOrder.id
                    ? 'Saving…'
                    : selectedOrder.status === 'Dispatched'
                      ? 'Save Tracking Link'
                      : 'Mark Dispatched'}
                </button>
              )}
              {selectedOrder.status === 'Dispatched' && (
                <button
                  onClick={() => void handleDeliver(selectedOrder.id)}
                  disabled={deliveringId === selectedOrder.id}
                  className="px-4 py-2 bg-[#1A1A1A] text-white text-xs uppercase font-bold disabled:opacity-40"
                >
                  {deliveringId === selectedOrder.id ? 'Saving…' : 'Mark Delivered'}
                </button>
              )}
              <button
                onClick={() => {
                  if (selectedOrder.phone) window.open(`https://wa.me/${selectedOrder.phone.replace(/\D/g, '')}`, '_blank');
                }}
                className="px-4 py-2 border text-xs uppercase font-bold"
              >
                WhatsApp Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-4">
      <span className="w-40 shrink-0 text-[11px] font-bold uppercase text-gray-500">{label}</span>
      <span className="break-words">{value && String(value).trim() ? value : '—'}</span>
    </div>
  );
}

const inputClass = 'w-full min-h-[44px] px-3.5 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C2A77A]';

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-bold uppercase mb-1">{label}</label>
      {children}
    </div>
  );
}