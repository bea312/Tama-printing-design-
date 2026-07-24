import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Edit2, Wallet, Download } from 'lucide-react';
import Header from '../components/common/Header';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { recordExpense, updateExpense, deleteExpense } from '../services/expenseService';
import { exportExpenses } from '../services/exportService';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '../utils/helpers';

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { category: EXPENSE_CATEGORIES[0], remark: '', amount: '', date: today() };

export default function Expenses() {
  const { expenses, expenseSummary, refresh, addToast } = useApp();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [confirmId, setConfirmId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...expenses]
      .filter((e) =>
        (!q || e.category.toLowerCase().includes(q) || (e.remark || '').toLowerCase().includes(q)) &&
        (!catFilter || e.category === catFilter))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, search, catFilter]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setErrors({}); setModal(true); };
  const openEdit = (e) => {
    setEditing(e);
    setForm({ category: e.category, remark: e.remark, amount: e.amount, date: e.date.slice(0, 10) });
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.category) e.category = 'Select a category';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter a valid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    try {
      if (editing) { updateExpense(editing.id, form); addToast(t('expenses.expenseUpdated'), 'success'); }
      else { recordExpense(form); addToast(t('expenses.expenseAdded'), 'success'); }
      refresh();
      setModal(false);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = (id) => {
    deleteExpense(id);
    refresh();
    addToast(t('expenses.expenseDeleted'), 'info');
  };

  return (
    <div>
      <Header title={t('expenses.title')} subtitle={t('expenses.subtitle')} />
      <div className="page-wrapper">
        <div className="grid-3" style={{ marginBottom: '24px' }}>
          {[
            { label: t('expenses.totalExpenses'), value: formatCurrency(expenseSummary.total), color: 'var(--accent-red)' },
            { label: t('expenses.records'), value: expenseSummary.count, color: 'var(--brand-blue-light)' },
            { label: t('expenses.avgPerExpense'), value: formatCurrency(expenseSummary.count ? expenseSummary.total / expenseSummary.count : 0), color: 'var(--accent-gold)' },
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
              <input placeholder={t('expenses.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: '180px', height: '40px' }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="">{t('common.allCategories')}</option>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-ghost" onClick={() => exportExpenses(filtered, 'csv')}>
              <Download size={14} /> {t('inventory.csv')}
            </button>
            <button className="btn btn-ghost" onClick={() => exportExpenses(filtered)}>
              <Download size={14} /> {t('inventory.excel')}
            </button>
            <button className="btn btn-danger" onClick={openAdd}>
              <Plus size={16} /> {t('expenses.addExpense')}
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('common.category')}</th>
                  <th>{t('stockIn.remark')}</th>
                  <th>{t('expenses.amountCol')}</th>
                  <th>{t('common.date')}</th>
                  <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5}>
                    <div className="empty-state"><Wallet size={40} /><h3>{t('expenses.noExpensesYet')}</h3><p>{t('expenses.recordFirstExpense')}</p></div>
                  </td></tr>
                ) : filtered.map((e) => (
                  <tr key={e.id}>
                    <td><span className="badge badge-red">{e.category}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.remark || '—'}</td>
                    <td style={{ color: 'var(--accent-red-light)', fontWeight: 700 }}>{formatCurrency(e.amount)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(e.date)}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(e)} title={t('common.edit')}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmId(e.id)} title={t('common.delete')} style={{ color: 'var(--accent-red-light)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {filtered.length} {t('products.of')} {expenses.length} {t('expenses.records')}
          </div>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? t('expenses.editExpense') : t('expenses.addExpense')}>
        <div className="form-group">
          <label className="form-label">{t('expenses.category')}</label>
          <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <span style={{ color: 'var(--accent-red)', fontSize: '0.78rem' }}>{errors.category}</span>}
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('expenses.amount')}</label>
            <input className="form-input" type="number" min="0" placeholder="50000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            {errors.amount && <span style={{ color: 'var(--accent-red)', fontSize: '0.78rem' }}>{errors.amount}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.date')}</label>
            <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('stockIn.remark')}</label>
          <input className="form-input" placeholder="e.g. July rent, staff transport…" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setModal(false)}>{t('common.cancel')}</button>
          <button className="btn btn-danger" onClick={handleSave}>{editing ? t('products.saveChanges') : t('expenses.addExpense')}</button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => handleDelete(confirmId)}
        title={t('expenses.deleteExpenseTitle')}
        message={t('expenses.deleteExpenseMessage')}
      />
    </div>
  );
}
