import { useState, useEffect, useRef } from 'react';
import { adminProductAPI } from '../services/api';
import AdminLayout from '../components/Layout';
import toast from 'react-hot-toast';

const CATEGORIES = ['Pizza', 'Burgers', 'Indian', 'Chinese', 'Desserts', 'Drinks', 'Healthy', 'Pasta'];
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const emptyForm = { name: '', description: '', price: '', category: 'Burgers', isAvailable: true, image: '' };

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const fetchProducts = async (q = '') => {
    setLoading(true);
    try {
      const params = q ? { search: q } : {};
      const { data } = await adminProductAPI.getAll(params);
      setProducts(data.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      isAvailable: product.isAvailable,
      image: product.image,
    });
    setShowForm(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await adminProductAPI.delete(product._id);
      toast.success('Product deleted');
      fetchProducts(search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      const { data } = await adminProductAPI.uploadImage(formData);
      setForm((prev) => ({ ...prev, image: data.imageUrl }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (product) => {
    try {
      await adminProductAPI.update(product._id, { isAvailable: !product.isAvailable });
      toast.success(`Product marked as ${!product.isAvailable ? 'available' : 'unavailable'}`);
      fetchProducts(search);
    } catch {
      toast.error('Update failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price || !form.category) {
      toast.error('All required fields must be filled');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await adminProductAPI.update(editingId, form);
        toast.success('Product updated');
      } else {
        await adminProductAPI.create(form);
        toast.success('Product created');
      }
      setShowForm(false);
      fetchProducts(search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Products">
      {/* Header controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ maxWidth: 300 }}
        />
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={openCreate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Product form modal */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: '70vh', padding: '4px 0' }}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Classic Chicken Burger" required />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-input form-textarea" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the dish..." required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input type="number" className="form-input" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} placeholder="249" min="0" step="0.01" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-input form-select" value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Image</label>
                {form.image && (
                  <div style={{ width: 80, height: 80, background: 'var(--soft-cloud)', marginBottom: 8, overflow: 'hidden' }}>
                    <img
                      src={form.image.startsWith('http') ? form.image : `${API_URL}${form.image}`}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={form.image}
                    onChange={(e) => setForm(p => ({ ...p, image: e.target.value }))}
                    placeholder="Image URL or upload below"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageUpload} />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) => setForm(p => ({ ...p, isAvailable: e.target.checked }))}
                    style={{ width: 16, height: 16 }}
                  />
                  <span className="form-label" style={{ margin: 0 }}>Available for ordering</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--hairline-soft)' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products table */}
      <div className="admin-card">
        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--mute)' }}>
            No products found
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const imgUrl = product.image
                    ? product.image.startsWith('http') ? product.image : `${API_URL}${product.image}`
                    : null;

                  return (
                    <tr key={product._id}>
                      <td>
                        <div style={{ width: 48, height: 48, background: 'var(--soft-cloud)', overflow: 'hidden' }}>
                          {imgUrl && <img src={imgUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />}
                        </div>
                      </td>
                      <td>
                        <p style={{ fontWeight: 600, fontSize: 13 }}>{product.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--stone)', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.description}</p>
                      </td>
                      <td><span className="status-chip status-confirmed">{product.category}</span></td>
                      <td style={{ fontWeight: 700 }}>₹{product.price}</td>
                      <td>
                        <button
                          className={`btn btn-sm ${product.isAvailable ? 'btn-success' : 'btn-secondary'}`}
                          onClick={() => handleToggle(product)}
                          style={{ fontSize: 11 }}
                        >
                          {product.isAvailable ? '✓ Available' : '✗ Unavailable'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(product)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .admin-modal {
          background: var(--canvas);
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .admin-modal__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--hairline-soft);
          font-size: 16px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .admin-modal form { padding: 20px 24px; }
      `}</style>
    </AdminLayout>
  );
};

export default Products;
