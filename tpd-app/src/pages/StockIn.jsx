import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, TrendingUp, Package } from 'lucide-react';
import Header from '../components/common/Header';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useApp } from '../context/AppContext';
import { recordPurchase, deletePurchase } from '../services/purchaseService';
import { formatCurrency, formatDate } from '../utils/helpers';

const today = () => new Date().toISOString().slice(0, 10);

export default function StockIn() {
  const { products, purchases, refresh, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [form, setForm] = useState({ productId: '', quantity: '', buyPrice: '', supplier: '', note: '', date: today() });
  const [errors, setErrors] = useState({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...purchases]
      .filter((p) => !q || p.productName.toLowerCase().includes(q) || (p.supplier || '').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [purchases, search]);

  const selectedProduct = products.find((p) => p.id === form.productId);

  const openModal = () => {
    setForm({ productId: products[0]?.id || '', quantity: '', buyPrice: products[0]?.buyPrice || '', supplier: '', note: '', date: today() });
    setErrors({});
    setModal(true);
  };

  const handleProductChange = (id) => {
    const p = products.find((x) => x.id === id);
    setForm((f) => ({ ...f, productId: id, buyPrice: p?.buyPrice || '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.productId) e.productId = 'Select a product';
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Enter valid quantity';
    if (!form.buyPrice || Number(form.buyPrice) <= 0) e.buyPrice = 'Enter valid price';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    try {
      recordPurchase(form);
      refresh();
      addToast(`Stock added for ${selectedProduct?.name}`, 'success');
      setModal(false);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = (id) => {
    deletePurchase(id);
    refresh();
    addToast('Purchase record deleted', 'info');
  };

  const totalSpent = purchases.reduce((s, p) => s + p.totalCost, 0);

  return (
    <div>
      <Header title="Stock In (Purchases)" subtitle="Record stock purchases and restocking" />
      <div className="page-wrapper">
        {/* Summary cards */}
        <div className="grid-3" style={{ marginBottom: '24px' }}>
          {[
            { label: 'Total Purchases', value: purchases.length, color: 'var(--brand-blue-light)' },
            { label: 'Total Spent', value: formatCurrency(totalSpent), color: 'var(--accent-gold)' },
            { label: 'Avg per Purchase', value: formatCurrency(purchases.length ? totalSpent / purchases.length : 0), color: 'var(--accent-cyan)' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>{s.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Poppins', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-bar" style={{ width: '260px' }}>
              <Search size={15} className="search-icon" />
              <input placeholder="Search purchases…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-success" onClick={openModal} disabled={products.length === 0}>
            <TrendingUp size={16} /> Record Purchase
          </button>
        </div>

        {products.length === 0 && (
          <div className="alert alert-warning">
            <Package size={16} style={{ flexShrink: 0 }} />
            No products found. Add products first before recording stock purchases.
          </div>
        )}

        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty Added</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state"><TrendingUp size={40} /><h3>No purchase records</h3><p>Record your first stock purchase above</p></div>
                  </td></tr>
                ) : filtered.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.productName}</td>
                    <td><span className="badge badge-blue">{p.category.split(' ')[0]}</span></td>
                    <td><span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>+{p.quantity}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(p.buyPrice)}</td>
                    <td style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{formatCurrency(p.totalCost)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.supplier || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(p.date)}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmId(p.id)} style={{ color: 'var(--accent-red-light)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {filtered.length} of {purchases.length} records
          </div>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Record Stock Purchase">
        <div className="form-group">
          <label className="form-label">Product *</label>
          <select className="form-select" value={form.productId} onChange={(e) => handleProductChange(e.target.value)}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock: {p.quantity})</option>)}
          </select>
          {errors.productId && <span style={{ color: 'var(--accent-red)', fontSize: '0.78rem' }}>{errors.productId}</span>}
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input className="form-input" type="number" min="1" placeholder="10" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            {errors.quantity && <span style={{ color: 'var(--accent-red)', fontSize: '0.78rem' }}>{errors.quantity}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Unit Cost (RWF) *</label>
            <input className="form-input" type="number" min="0" placeholder="2500" value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} />
            {errors.buyPrice && <span style={{ color: 'var(--accent-red)', fontSize: '0.78rem' }}>{errors.buyPrice}</span>}
          </div>
        </div>
        {form.quantity && form.buyPrice && (
          <div style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Total cost: </span>
            <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{formatCurrency(Number(form.quantity) * Number(form.buyPrice))}</span>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Supplier (optional)</label>
          <input className="form-input" placeholder="e.g. Paper World RW" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input className="form-input" placeholder="Any notes…" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-success" onClick={handleSave}>Record Purchase</button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => handleDelete(confirmId)}
        title="Delete Purchase Record"
        message="Delete this purchase record? Note: this does NOT reduce the current stock quantity."
      />
    </div>
  );
}
