import React, { useCallback, useEffect, useState } from 'react';
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
};

type AdminOrder = {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  total_amount: number | string;
  status: string;
  payment_method: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
};

type AdminTab = 'products' | 'orders';

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
};

function splitCsv(value: string): string[] {
  return value.split(',').map((part) => part.trim()).filter(Boolean);
}

type GateState = 'checking' | 'locked' | 'granted';

export function AdminPage() {
  const [gate, setGate] = useState<GateState>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>('products');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

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
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

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
    if (fnError) {
      setError(fnError.message);
      return;
    }
    if (data?.error) {
      setError(data.error);
      return;
    }
    setOrders((data?.orders as AdminOrder[]) ?? []);
  }, []);

  useEffect(() => {
    if (gate === 'granted') void fetchProducts();
  }, [gate, fetchProducts]);

  useEffect(() => {
    if (gate === 'granted' && tab === 'orders') void fetchOrders();
  }, [gate, tab, fetchOrders]);

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
    };

    const { data: saveResult, error: saveError } = await supabase.functions.invoke('manage-products', {
      body: {
        action: editingId ? 'update' : 'create',
        id: editingId ?? undefined,
        product: payload,
      },
    });

    setSaving(false);
    if (saveError) return setError(saveError.message);
    if (saveResult?.error) return setError(saveResult.error);

    setStatus(editingId ? `Updated ${payload.name}` : `Added ${payload.name}`);
    resetForm();
    await fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const { data, error: fnError } = await supabase.functions.invoke('manage-products', {
      body: { action: 'delete', id },
    });
    if (fnError) return setError(fnError.message);
    if (data?.error) return setError(data.error);
    setStatus('Product deleted');
    await fetchProducts();
  };

  const handleDispatch = async (id: string) => {
    setDispatchingId(id);
    const { data, error: fnError } = await supabase.functions.invoke('get-admin-orders', {
      body: { action: 'dispatch', id },
    });
    setDispatchingId(null);
    if (fnError) return setError(fnError.message);
    if (data?.error) return setError(data.error);
    setStatus('Order marked as dispatched');
    await fetchOrders();
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Delete this order permanently?")) return;
    setDeletingOrderId(id);
    const { data, error: fnError } = await supabase.functions.invoke('get-admin-orders', {
      body: { action: 'delete', id },
    });
    setDeletingOrderId(null);
    if (fnError) return setError(fnError.message);
    if (data?.error) return setError(data.error);
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
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-extrabold text-3xl uppercase">Admin Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 border border-[#E5E5E5] text-xs font-bold uppercase tracking-wider hover:border-[#1A1A1A]"
          >
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {['products', 'orders'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as AdminTab)}
              className={`px-6 py-2 text-xs font-bold uppercase tracking-wider ${tab === t ? 'bg-[#1A1A1A] text-white' : 'border border-[#E5E5E5]'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}
        {status && <p className="mb-4 text-green-700 text-sm">{status}</p>}

        {tab === 'orders' ? (
          <div className="overflow-x-auto border border-[#E5E5E5]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FBFBFB] uppercase text-xs">
                <tr>
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
                  <tr><td colSpan={6} className="p-3 text-center text-gray-500">Loading orders…</td></tr>
                )}
                {!ordersLoading && orders.length === 0 && (
                  <tr><td colSpan={6} className="p-3 text-center text-gray-500">No orders yet.</td></tr>
                )}
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-[#E5E5E5]">
                    <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-3">{o.customer_name} <br/><span className="text-xs text-gray-500">{o.phone}</span></td>
                    <td className="p-3 font-semibold">₹{o.total_amount}</td>
                    <td className="p-3 text-xs uppercase font-bold">{o.payment_method ?? '—'}</td>
                    <td className="p-3 uppercase text-xs font-bold">{o.status}</td>
                    <td className="p-3 text-right flex justify-end gap-2">
                       <button onClick={() => setSelectedOrder(o)} className="px-3 py-1 border text-xs uppercase">View Details</button>
                       <button onClick={() => handleDispatch(o.id)} disabled={o.status === 'Dispatched'} className="px-3 py-1 border text-xs uppercase disabled:opacity-40">Mark Dispatched</button>
                       <button onClick={() => handleDeleteOrder(o.id)} className="px-3 py-1 border text-red-600 text-xs uppercase">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 p-6 border border-[#E5E5E5]">
              
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

            <div className="overflow-x-auto border border-[#E5E5E5]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FBFBFB] uppercase text-xs">
                  <tr><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3 text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-[#E5E5E5]">
                      <td className="p-3">{p.name}</td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3">₹{p.price}</td>
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
      </div>

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
              <Detail label="Order ID" value={selectedOrder.id} />
              <Detail label="Date" value={new Date(selectedOrder.created_at).toLocaleString()} />
              <Detail label="Name" value={selectedOrder.customer_name} />
              <Detail label="Phone" value={selectedOrder.phone} />
              <Detail label="Email" value={selectedOrder.email} />
              <Detail label="Full Address" value={selectedOrder.address} />
              <Detail label="Total Amount" value={`₹${selectedOrder.total_amount}`} />
              <Detail label="Payment Method" value={selectedOrder.payment_method} />
              <Detail label="Status" value={selectedOrder.status} />
              <Detail label="Razorpay Payment ID" value={selectedOrder.razorpay_payment_id} />
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-[#E5E5E5]">
              <button
                onClick={() => { void handleDispatch(selectedOrder.id); setSelectedOrder(null); }}
                disabled={selectedOrder.status === 'Dispatched'}
                className="px-4 py-2 border text-xs uppercase font-bold disabled:opacity-40"
              >
                Mark Dispatched
              </button>
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