import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ADMIN_PASSWORD = 'yusradmin';
const ADMIN_AUTH_KEY = 'adminAuth';

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
  address: string;
  total_amount: number | string;
  status: string;
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

function readAdminAuth(): boolean {
  try {
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function AdminPage() {
  const [gate, setGate] = useState<'locked' | 'granted' | 'denied'>(() =>
    readAdminAuth() ? 'granted' : 'locked'
  );
  const [password, setPassword] = useState('');
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

  // Custom Category States
  const [categories, setCategories] = useState(['Tees', 'Hoodies']);
  const [newCategory, setNewCategory] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      try {
        localStorage.setItem(ADMIN_AUTH_KEY, 'true');
      } catch {}
      setGate('granted');
      setError(null);
    } else {
      setGate('denied');
    }
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
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    setOrdersLoading(false);
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setOrders((data as AdminOrder[]) ?? []);
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

    const { error: saveError } = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId)
      : await supabase.from('products').insert({ ...payload, id: payload.slug });

    setSaving(false);
    if (saveError) return setError(saveError.message);

    setStatus(editingId ? `Updated ${payload.name}` : `Added ${payload.name}`);
    resetForm();
    await fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return setError(error.message);
    setStatus('Product deleted');
    await fetchProducts();
  };

  const handleDispatch = async (id: string) => {
    setDispatchingId(id);
    const { error } = await supabase.from('orders').update({ status: 'Dispatched' }).eq('id', id);
    setDispatchingId(null);
    if (error) return setError(error.message);
    setStatus('Order marked as dispatched');
    await fetchOrders();
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Delete this order permanently?")) return;
    setDeletingOrderId(id);
    const { error } = await supabase.from('orders').delete().eq('id', id);
    setDeletingOrderId(null);
    if (error) return setError(error.message);
    setStatus('Order deleted');
    await fetchOrders();
  };

  if (gate === 'denied') return <div className="min-h-[60vh] flex items-center justify-center text-2xl font-bold uppercase tracking-widest">Access Denied</div>;

  if (gate === 'locked') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-4">
          <h1 className="font-heading font-extrabold text-3xl uppercase tracking-tight text-center">Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Password"
            className="w-full min-h-[44px] px-3.5 border border-[#E5E5E5] focus:outline-none focus:border-[#C2A77A] text-center"
          />
          <button type="submit" className="w-full min-h-[44px] bg-[#1A1A1A] text-white font-bold uppercase">Unlock</button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="font-heading font-extrabold text-3xl uppercase mb-8">Admin Dashboard</h1>

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
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-[#E5E5E5]">
                    <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-3">{o.customer_name} <br/><span className="text-xs text-gray-500">{o.phone}</span></td>
                    <td className="p-3 font-semibold">₹{o.total_amount}</td>
                    <td className="p-3 uppercase text-xs font-bold">{o.status}</td>
                    <td className="p-3 text-right flex justify-end gap-2">
                       <button onClick={() => handleDispatch(o.id)} disabled={o.status === 'Dispatched'} className="px-3 py-1 border text-xs uppercase">Mark Dispatched</button>
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