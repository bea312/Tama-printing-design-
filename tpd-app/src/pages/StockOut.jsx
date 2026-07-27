import { useState, useMemo } from 'react';
import { Search, Trash2, Edit2, TrendingDown, ShoppingCart, Download } from 'lucide-react';
import Header from '../components/common/Header';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { recordSale, updateSale, deleteSale, getSalePayment } from '../services/salesService';
import { exportSales } from '../services/exportService';
import { formatCurrency, formatDate } from '../utils/helpers';

const today = () => new Date().toISOString().slice(0, 10);

export default function StockOut() {
  const { products, sales, refresh, addToast } = useApp();
  const { user } = useAuth();
  const { t } = useLanguage();
  const isEmployee = user?.role === 'employee';
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [form, setForm] = useState({ productId: '', quantity: '', quality: '', remark: '', cashAmount: '', momoAmount: '', date: today() });
  const [errors, setErrors] = useState({});

  const availableProducts = products.filter((p) => p.quantity > 0);
  const selectedProduct = products.find((p) => p.id === form.productId);
  const editableStockCap = selectedProduct
    ? selectedProduct.quantity + (editingSale && editingSale.productId === selectedProduct.id ? editingSale.quantity : 0)
    : 0;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...sales]
      .filter((s) => !q || s.productName.toLowerCase().includes(q) || (s.quality || '').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sales, search]);

  const openModal = () => {
    setEditingSale(null);
    const firstAvail = availableProducts[0];
    setForm({ productId: firstAvail?.id || '', quantity: '', quality: '', remark: '', cashAmount: '', momoAmount: '', date: today() });
    setErrors({});
    setModal(true);
  };

  const openEdit = (s) => {
    const { cashAmount, momoAmount } = getSalePayment(s);
    setEditingSale(s);
    setForm({
      productId: s.productId,
      quantity: s.quantity,
      quality: s.quality || '',
      remark: s.remark || '',
      cashAmount: cashAmount || '',
      momoAmount: momoAmount || '',
      date: s.date.slice(0, 10),
    });
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.productId) e.productId = 'Select a product';
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Enter valid quantity';
    if (selectedProduct && Number(form.quantity) > editableStockCap)
      e.quantity = `Only ${editableStockCap} available`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    try {
      if (editingSale) {
        updateSale(editingSale.id, form);
        refresh();
        addToast(t('stockOut.saleUpdated'), 'success');
      } else {
        const sale = recordSale(form);
        refresh();
        addToast(isEmployee ? t('stockOut.saleRecordedPlain') : `${t('stockOut.saleRecorded')} ${formatCurrency(sale.profit)}`, 'success');
      }
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

  const stats = [
    { label: t('stockOut.totalSales'), value: sales.length, color: 'var(--brand-blue-light)' },
    { label: t('stockOut.totalRevenue'), value: formatCurrency(totalRevenue), color: 'var(--accent-gold)' },
    ...(isEmployee ? [] : [{ label: t('stockOut.totalProfit'), value: formatCurrency(totalProfit), color: 'var(--accent-green)' }]),
  ];

  return (
    <div>
      <Header title={t('stockOut.title')} subtitle={t('stockOut.subtitle')} />
      <div className="page-wrapper">
        <div className={`grid-${stats.length}`} style={{ marginBottom: '24px' }}>
          {stats.map((s) => (
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
          <div style={{ display: 'flex', gap: '8px' }}>
            {isEmployee && (
              <button className="btn btn-ghost" onClick={() => exportSales(filtered, 'excel', { includeProfit: false })}>
                <Download size={14} /> {t('reports.salesExcel')}
              </button>
            )}
            <button className="btn btn-danger" onClick={openModal} disabled={availableProducts.length === 0}>
              <TrendingDown size={16} /> {t('stockOut.recordSale')}
            </button>
          </div>
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
                  {!isEmployee && <th>{t('stockOut.profit')}</th>}
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
                  <tr><td colSpan={isEmployee ? 11 : 12}>
                    <div className="empty-state"><ShoppingCart size={40} /><h3>{t('stockOut.noSalesRecorded')}</h3><p>{t('stockOut.recordFirstSale')}</p></div>
                  </td></tr>
                ) : filtered.map((s) => {
                  const { cashAmount, momoAmount, paid, balance } = getSalePayment(s);
                  return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.productName}</td>
                    <td><span className="badge badge-purple">{(s.category || 'Other').split(' ')[0]}</span></td>
                    <td><span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>-{s.quantity}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(s.sellPrice)}</td>
                    <td style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{formatCurrency(s.totalRevenue)}</td>
                    {!isEmployee && <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{formatCurrency(s.profit)}</td>}
                    <td style={{ color: 'var(--text-secondary)' }}>{s.quality || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {cashAmount > 0 && <span className="badge badge-green">{t('stockOut.cash')} {formatCurrency(cashAmount)}</span>}
                        {momoAmount > 0 && <span className="badge badge-gold">{t('stockOut.momo')} {formatCurrency(momoAmount)}</span>}
                      </div>
                    </td>
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
                        {isEmployee ? (
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(s)} title={t('common.edit')}>
                            <Edit2 size={14} />
                          </button>
                        ) : (
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmId(s.id)} style={{ color: 'var(--accent-red-light)' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editingSale ? t('stockOut.editSale') : t('stockOut.recordSale')}>
        <div className="form-group">
          <label className="form-label">{t('stockIn.product')}</label>
          <select
            className="form-select"
            value={form.productId}
            disabled={!!editingSale}
            onChange={(e) => setForm({ ...form, productId: e.target.value, quantity: '' })}
          >
            <option value="">{t('stockOut.selectProduct')}</option>
            {(editingSale && !availableProducts.some((p) => p.id === editingSale.productId)
              ? [...availableProducts, products.find((p) => p.id === editingSale.productId)].filter(Boolean)
              : availableProducts
            ).map((p) => (
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
              max={editableStockCap || undefined}
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
            {!isEmployee && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t('stockOut.profitLabel')}</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{formatCurrency((selectedProduct.sellPrice - selectedProduct.buyPrice) * Number(form.quantity))}</span>
              </div>
            )}
            {(form.cashAmount !== '' || form.momoAmount !== '') && (() => {
              const total = selectedProduct.sellPrice * Number(form.quantity);
              const paid = (Number(form.cashAmount) || 0) + (Number(form.momoAmount) || 0);
              const balance = total - paid;
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
            <label className="form-label">{t('stockOut.cashAmount')}</label>
            <input
              className="form-input"
              type="number"
              min="0"
              placeholder="0"
              value={form.cashAmount}
              onChange={(e) => setForm({ ...form, cashAmount: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('stockOut.momoAmount')}</label>
            <input
              className="form-input"
              type="number"
              min="0"
              placeholder="0"
              value={form.momoAmount}
              onChange={(e) => setForm({ ...form, momoAmount: e.target.value })}
            />
          </div>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginTop: '-8px', marginBottom: '12px' }}>{t('stockOut.leaveBlankFullyPaid')}</span>
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
          <button className="btn btn-danger" onClick={handleSave}>{editingSale ? t('common.save') : t('stockOut.recordSale')}</button>
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
