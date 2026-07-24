import { useState, useMemo } from 'react';
import { Search, Trash2, TrendingDown, ShoppingCart } from 'lucide-react';
import Header from '../components/common/Header';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { recordSale, deleteSale } from '../services/salesService';
import { formatCurrency, formatDate } from '../utils/helpers';

const today = () => new Date().toISOString().slice(0, 10);

export default function StockOut() {
  const { products, sales, refresh, addToast } = useApp();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [form, setForm] = useState({ productId: '', quantity: '', quality: '', remark: '', paymentMethod: 'cash', amountPaid: '', date: today() });
  const [errors, setErrors] = useState({});

  const availableProducts = products.filter((p) => p.quantity > 0);
  const selectedProduct = products.find((p) => p.id === form.productId);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...sales]
      .filter((s) => !q || s.productName.toLowerCase().includes(q) || (s.quality || '').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sales, search]);

  const openModal = () => {
    const firstAvail = availableProducts[0];
    setForm({ productId: firstAvail?.id || '', quantity: '', quality: '', remark: '', paymentMethod: 'cash', amountPaid: '', date: today() });
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
      addToast(`${t('stockOut.saleRecorded')} ${formatCurrency(sale.profit)}`, 'success');
      setModal(false);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = (id) => {
    deleteSale(id);
    refresh();
    addToast(t('stockOut.saleDeleted'), 'info');
  };

  const totalRevenue = sales.reduce((s, x) => s + x.totalRevenue, 0);
  const totalProfit = sales.reduce((s, x) => s + x.profit, 0);

  return (
    <div>
      <Header title={t('stockOut.title')} subtitle={t('stockOut.subtitle')} />
      <div className="page-wrapper">
        <div className="grid-3" style={{ marginBottom: '24px' }}>
          {[
            { label: t('stockOut.totalSales'), value: sales.length, color: 'var(--brand-blue-light)' },
            { label: t('stockOut.totalRevenue'), value: formatCurrency(totalRevenue), color: 'var(--accent-gold)' },
            { label: t('stockOut.totalProfit'), value: formatCurrency(totalProfit), color: 'var(--accent-green)' },
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
              <input placeholder={t('stockOut.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-danger" onClick={openModal} disabled={availableProducts.length === 0}>
            <TrendingDown size={16} /> {t('stockOut.recordSale')}
          </button>
        </div>

        {availableProducts.length === 0 && products.length > 0 && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            {t('stockOut.allOutOfStock')}
          </div>
        )}

        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('common.product')}</th>
                  <th>{t('common.category')}</th>
                  <th>{t('stockOut.qtySold')}</th>
                  <th>{t('stockOut.unitPrice')}</th>
                  <th>{t('stockOut.revenue')}</th>
                  <th>{t('stockOut.profit')}</th>
                  <th>{t('stockOut.quality')}</th>
                  <th>{t('stockOut.payment')}</th>
                  <th>{t('stockOut.amountPaid')}</th>
                  <th>{t('stockOut.balance')}</th>
                  <th>{t('common.date')}</th>
                  <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={12}>
                    <div className="empty-state"><ShoppingCart size={40} /><h3>{t('stockOut.noSalesRecorded')}</h3><p>{t('stockOut.recordFirstSale')}</p></div>
                  </td></tr>
                ) : filtered.map((s) => {
                  const paid = s.amountPaid ?? s.totalRevenue;
                  const balance = s.totalRevenue - paid;
                  return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.productName}</td>
                    <td><span className="badge badge-purple">{(s.category || 'Other').split(' ')[0]}</span></td>
                    <td><span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>-{s.quantity}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(s.sellPrice)}</td>
                    <td style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{formatCurrency(s.totalRevenue)}</td>
                    <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{formatCurrency(s.profit)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.quality || '—'}</td>
                    <td><span className={`badge ${s.paymentMethod === 'momo' ? 'badge-gold' : 'badge-green'}`}>{s.paymentMethod === 'momo' ? t('stockOut.momo') : t('stockOut.cash')}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(paid)}</td>
                    <td>
                      {balance > 0
                        ? <span className="badge badge-red">{t('stockOut.owes')} {formatCurrency(balance)}</span>
                        : balance < 0
                          ? <span className="badge badge-blue">{t('stockOut.change')} {formatCurrency(-balance)}</span>
                          : <span className="badge badge-green">{t('stockOut.paidInFull')}</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(s.date)}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmId(s.id)} style={{ color: 'var(--accent-red-light)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {filtered.length} {t('products.of')} {sales.length} {t('stockOut.records')}
          </div>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={t('stockOut.recordSale')}>
        <div className="form-group">
          <label className="form-label">{t('stockIn.product')}</label>
          <select
            className="form-select"
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value, quantity: '' })}
          >
            <option value="">{t('stockOut.selectProduct')}</option>
            {availableProducts.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.quantity} in stock</option>
            ))}
          </select>
          {errors.productId && <span style={{ color: 'var(--accent-red)', fontSize: '0.78rem' }}>{errors.productId}</span>}
        </div>

        {selectedProduct && (
          <div style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('stockOut.sellPriceLabel')}</span>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{formatCurrency(selectedProduct.sellPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('stockOut.available')}</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{selectedProduct.quantity} units</span>
            </div>
          </div>
        )}

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('stockIn.quantityLabel')}</label>
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
            <label className="form-label">{t('common.date')}</label>
            <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>

        {selectedProduct && form.quantity > 0 && (
          <div style={{ padding: '10px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('stockOut.totalRevenueLabel')}</span>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{formatCurrency(selectedProduct.sellPrice * Number(form.quantity))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('stockOut.profitLabel')}</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{formatCurrency((selectedProduct.sellPrice - selectedProduct.buyPrice) * Number(form.quantity))}</span>
            </div>
            {form.amountPaid !== '' && (() => {
              const total = selectedProduct.sellPrice * Number(form.quantity);
              const balance = total - Number(form.amountPaid);
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('stockOut.balance')}</span>
                  <span style={{ color: balance > 0 ? 'var(--accent-red-light)' : balance < 0 ? 'var(--brand-blue-light)' : 'var(--accent-green)', fontWeight: 700 }}>
                    {balance > 0 ? `${t('stockOut.owes')} ${formatCurrency(balance)}` : balance < 0 ? `${t('stockOut.change')} ${formatCurrency(-balance)}` : t('stockOut.paidInFull')}
                  </span>
                </div>
              );
            })()}
          </div>
        )}

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('stockOut.paymentMethod')}</label>
            <select className="form-select" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              <option value="cash">{t('stockOut.cash')}</option>
              <option value="momo">{t('stockOut.momo')}</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('stockOut.amountPaid')}</label>
            <input
              className="form-input"
              type="number"
              min="0"
              placeholder={selectedProduct && form.quantity ? String(selectedProduct.sellPrice * Number(form.quantity)) : '0'}
              value={form.amountPaid}
              onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{t('stockOut.leaveBlankFullyPaid')}</span>
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('stockOut.quality')}</label>
            <input className="form-input" placeholder="e.g. Grade A / Premium" value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('stockOut.remark')}</label>
            <input className="form-input" placeholder="Any remarks…" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setModal(false)}>{t('common.cancel')}</button>
          <button className="btn btn-danger" onClick={handleSave}>{t('stockOut.recordSale')}</button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => handleDelete(confirmId)}
        title={t('stockOut.deleteSaleTitle')}
        message={t('stockOut.deleteSaleMessage')}
      />
    </div>
  );
}
