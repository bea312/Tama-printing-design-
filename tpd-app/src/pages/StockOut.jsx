import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, TrendingDown, ShoppingCart } from 'lucide-react';
import Header from '../components/common/Header';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useApp } from '../context/AppContext';
import { recordSale, deleteSale } from '../services/salesService';
import { formatCurrency, formatDate } from '../utils/helpers';

const today = () => new Date().toISOString().slice(0, 10);

export default function StockOut() {
  const { products, sales, refresh, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [form, setForm] = useState({ productId: '', quantity: '', customerName: '', note: '', date: today() });
  const [errors, setErrors] = useState({});

  const availableProducts = products.filter((p) => p.quantity > 0);
  const selectedProduct = products.find((p) => p.id === form.productId);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...sales]
      .filter((s) => !q || s.productName.toLowerCase().includes(q) || (s.customerName || '').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sales, search]);

  const openModal = () => {
    const firstAvail = availableProducts[0];
    setForm({ productId: firstAvail?.id || '', quantity: '', customerName: '', note: '', date: today() });
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.productId) e.productId = 'Select a product';
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Enter valid quantity';
    if (selectedProduct && Number(form.quantity) > selectedProduct.quantity)
      e.quantity = `Only ${selectedProduct.quantity} available`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    try {
      const sale = recordSale(form);
      refresh();
      addToast(`Sale recorded — Profit: ${formatCurrency(sale.profit)}`, 'success');
      setModal(false);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = (id) => {
    deleteSale(id);
    refresh();
    addToast('Sale record deleted', 'info');
  };

  const totalRevenue = sales.reduce((s, x) => s + x.totalRevenue, 0);
  const totalProfit = sales.reduce((s, x) => s + x.profit, 0);

  return (
    <div>
      <Header title="Stock Out (Sales)" subtitle="Record sales and track outgoing stock" />
      <div className="page-wrapper">
        <div className="grid-3" style={{ marginBottom: '24px' }}>
          {[
            { label: 'Total Sales', value: sales.length, color: 'var(--brand-blue-light)' },
            { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'var(--accent-gold)' },
            { label: 'Total Profit', value: formatCurrency(totalProfit), color: 'var(--accent-green)' },
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
              <input placeholder="Search sales…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-danger" onClick={openModal} disabled={availableProducts.length === 0}>
            <TrendingDown size={16} /> Record Sale
          </button>
        </div>

        {availableProducts.length === 0 && products.length > 0 && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            All products are out of stock. Please record a stock purchase first.
          </div>
        )}

        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty Sold</th>
                  <th>Unit Price</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9}>
                    <div className="empty-state"><ShoppingCart size={40} /><h3>No sales recorded</h3><p>Record your first sale above</p></div>
                  </td></tr>
                ) : filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.productName}</td>
                    <td><span className="badge badge-purple">{s.category.split(' ')[0]}</span></td>
                    <td><span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>-{s.quantity}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(s.sellPrice)}</td>
                    <td style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{formatCurrency(s.totalRevenue)}</td>
                    <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{formatCurrency(s.profit)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.customerName || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(s.date)}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmId(s.id)} style={{ color: 'var(--accent-red-light)' }}>
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
            {filtered.length} of {sales.length} records
          </div>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Record Sale">
        <div className="form-group">
          <label className="form-label">Product *</label>
          <select
            className="form-select"
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value, quantity: '' })}
          >
            <option value="">Select product…</option>
            {availableProducts.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.quantity} in stock</option>
            ))}
          </select>
          {errors.productId && <span style={{ color: 'var(--accent-red)', fontSize: '0.78rem' }}>{errors.productId}</span>}
        </div>

        {selectedProduct && (
          <div style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Sell price:</span>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{formatCurrency(selectedProduct.sellPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Available:</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{selectedProduct.quantity} units</span>
            </div>
          </div>
        )}

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input
              className="form-input"
              type="number"
              min="1"
              max={selectedProduct?.quantity}
              placeholder="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            {errors.quantity && <span style={{ color: 'var(--accent-red)', fontSize: '0.78rem' }}>{errors.quantity}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>

        {selectedProduct && form.quantity > 0 && (
          <div style={{ padding: '10px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total revenue:</span>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{formatCurrency(selectedProduct.sellPrice * Number(form.quantity))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Profit:</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{formatCurrency((selectedProduct.sellPrice - selectedProduct.buyPrice) * Number(form.quantity))}</span>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Customer Name (optional)</label>
          <input className="form-input" placeholder="Walk-in / Company name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Note (optional)</label>
          <input className="form-input" placeholder="Any notes…" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleSave}>Record Sale</button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => handleDelete(confirmId)}
        title="Delete Sale Record"
        message="Delete this sale record? Note: this does NOT restore the stock quantity."
      />
    </div>
  );
}
