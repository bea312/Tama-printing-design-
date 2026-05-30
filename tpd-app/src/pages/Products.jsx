import { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Plus, Search, Edit2, Trash2, Package, ArrowUpDown,
  Upload, Download, CheckCircle2, XCircle, FileSpreadsheet,
} from 'lucide-react';
import Header from '../components/common/Header';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useApp } from '../context/AppContext';
import { addProduct, updateProduct, deleteProduct } from '../services/productService';
import { formatCurrency, getStockStatus, CATEGORIES } from '../utils/helpers';

const EMPTY = { name: '', category: CATEGORIES[0], buyPrice: '', sellPrice: '', quantity: '', minStock: '5' };

/* ── Flexible column mapper ── */
const normalise = (str) => String(str || '').toLowerCase().replace(/[\s_\-]/g, '');

const COL_MAP = {
  name:      ['name','productname','product','itemname','item','description'],
  category:  ['category','cat','type','producttype','itemtype'],
  buyPrice:  ['buyprice','buycost','unitcost','costprice','purchaseprice','cost','buyingprice','inputprice'],
  sellPrice: ['sellprice','sellingprice','unitprice','salesprice','price','retailprice','outputprice'],
  quantity:  ['quantity','qty','stock','initialstock','initialquantity','currentstock','units','amount'],
  minStock:  ['minstock','minimumstock','minstocklevel','alertlevel','reorderpoint','minqty'],
};

function mapHeaders(headerRow) {
  const map = {};
  headerRow.forEach((h, i) => {
    const k = normalise(h);
    for (const [field, aliases] of Object.entries(COL_MAP)) {
      if (aliases.includes(k)) { map[field] = i; break; }
    }
  });
  return map;
}

function parseExcelRows(data) {
  if (!data || data.length < 2) return { rows: [], errors: ['File is empty or missing header row'] };

  const headers = data[0].map(String);
  const colMap = mapHeaders(headers);

  if (colMap.name === undefined) {
    return { rows: [], errors: ['Could not find a "Name" column. Please check the template.'] };
  }

  const rows = [];
  const parseErrors = [];

  data.slice(1).forEach((row, idx) => {
    const line = idx + 2;
    const name = String(row[colMap.name] ?? '').trim();
    if (!name) return; // skip blank rows

    const buyPrice  = Number(row[colMap.buyPrice]  ?? 0);
    const sellPrice = Number(row[colMap.sellPrice] ?? 0);
    const quantity  = Math.max(0, Number(row[colMap.quantity]  ?? 0));
    const minStock  = Math.max(1, Number(row[colMap.minStock]  ?? 5));

    // Map category loosely
    const rawCat = String(row[colMap.category] ?? '').trim();
    const category = CATEGORIES.find((c) =>
      c.toLowerCase().includes(rawCat.toLowerCase()) ||
      rawCat.toLowerCase().includes(c.split(' ')[0].toLowerCase())
    ) || CATEGORIES[CATEGORIES.length - 1]; // fallback → "Other"

    const rowErrors = [];
    if (buyPrice  <= 0) rowErrors.push('buy price missing');
    if (sellPrice <= 0) rowErrors.push('sell price missing');

    if (rowErrors.length) {
      parseErrors.push(`Row ${line} (${name}): ${rowErrors.join(', ')}`);
    }

    rows.push({
      name, category, buyPrice, sellPrice, quantity, minStock,
      valid: rowErrors.length === 0,
      _line: line,
    });
  });

  return { rows, errors: parseErrors };
}

/* ── Download blank template ── */
function downloadTemplate() {
  const headers = ['Name', 'Category', 'Buy Price', 'Sell Price', 'Quantity', 'Min Stock'];
  const example = [
    ['A4 White Paper (500 sheets)', 'Paper & Cardstock', 2500, 3500, 100, 10],
    ['HP 680 Black Ink Cartridge',  'Toner & Cartridges', 8000, 12000, 20, 5],
    ['Stapler (Heavy Duty)',         'Stationery',         3500, 5500,  12, 3],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...example]);
  // column widths
  ws['!cols'] = [{ wch: 36 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'TPD_Products_Template.xlsx');
}

/* ══════════════════════════════════════════════════ */
export default function Products() {
  const { products, refresh, addToast } = useApp();

  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [sortKey,   setSortKey]   = useState('name');
  const [sortAsc,   setSortAsc]   = useState(true);

  /* Add / Edit modal */
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});

  /* Delete confirm */
  const [confirmId, setConfirmId] = useState(null);

  /* Excel import */
  const fileInputRef = useRef(null);
  const [importModal,   setImportModal]   = useState(false);
  const [importRows,    setImportRows]    = useState([]);
  const [importErrors,  setImportErrors]  = useState([]);
  const [importing,     setImporting]     = useState(false);

  /* ── Filtered + sorted list ── */
  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const q = search.toLowerCase();
      return (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
        && (!catFilter || p.category === catFilter);
    });
    list.sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (typeof av === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? av - bv : bv - av;
    });
    return list;
  }, [products, search, catFilter, sortKey, sortAsc]);

  /* ── Add / Edit handlers ── */
  const openAdd  = () => { setEditing(null); setForm(EMPTY); setErrors({}); setModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, buyPrice: p.buyPrice, sellPrice: p.sellPrice, quantity: p.quantity, minStock: p.minStock });
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                                      e.name      = 'Name is required';
    if (!form.buyPrice  || Number(form.buyPrice)  <= 0)         e.buyPrice  = 'Enter valid buy price';
    if (!form.sellPrice || Number(form.sellPrice) <= 0)         e.sellPrice = 'Enter valid sell price';
    if (Number(form.sellPrice) < Number(form.buyPrice))         e.sellPrice = 'Sell price must be ≥ buy price';
    if (!editing && (form.quantity === '' || Number(form.quantity) < 0)) e.quantity = 'Enter quantity';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editing) { updateProduct(editing.id, form); addToast('Product updated', 'success'); }
    else         { addProduct(form);                 addToast('Product added',   'success'); }
    refresh();
    setModal(false);
  };

  const handleDelete = (id) => { deleteProduct(id); refresh(); addToast('Product deleted', 'info'); };

  /* ── Excel import handlers ── */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file can be re-selected

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const { rows, errors: parseErrors } = parseExcelRows(data);
        setImportRows(rows);
        setImportErrors(parseErrors);
        setImportModal(true);
      } catch {
        addToast('Could not read the file. Make sure it is a valid Excel or CSV file.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportConfirm = () => {
    const valid = importRows.filter((r) => r.valid);
    if (valid.length === 0) { addToast('No valid rows to import', 'warning'); return; }
    setImporting(true);
    valid.forEach((r) => addProduct(r));
    refresh();
    setImporting(false);
    setImportModal(false);
    addToast(`${valid.length} product${valid.length > 1 ? 's' : ''} imported successfully`, 'success');
  };

  /* ── Sort helper ── */
  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc); else { setSortKey(key); setSortAsc(true); }
  };

  const SortTh = ({ k, label }) => (
    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort(k)}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        <ArrowUpDown size={11} style={{ opacity: sortKey === k ? 1 : 0.3, color: sortKey === k ? 'var(--brand-blue-light)' : undefined }} />
      </span>
    </th>
  );

  const validCount   = importRows.filter((r) => r.valid).length;
  const invalidCount = importRows.filter((r) => !r.valid).length;

  /* ══════════ RENDER ══════════ */
  return (
    <div>
      <Header title="Products" subtitle="Manage your product catalog" />
      <div className="page-wrapper">

        {/* ── Toolbar ── */}
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-bar" style={{ width: '260px' }}>
              <Search size={15} className="search-icon" />
              <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: '180px', height: '40px' }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="toolbar-right">
            {/* Download template */}
            <button className="btn btn-ghost" onClick={downloadTemplate} title="Download Excel template">
              <Download size={15} /> Template
            </button>

            {/* Import Excel — hidden file input + visible button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button
              className="btn btn-ghost"
              style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green-light)' }}
              onClick={() => fileInputRef.current?.click()}
              title="Import products from Excel"
            >
              <Upload size={15} /> Import Excel
            </button>

            {/* Add single product */}
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        {/* ── Products table ── */}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <SortTh k="name"      label="Product Name" />
                  <th>Category</th>
                  <SortTh k="buyPrice"  label="Buy Price" />
                  <SortTh k="sellPrice" label="Sell Price" />
                  <th>Margin</th>
                  <SortTh k="quantity"  label="Stock" />
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <FileSpreadsheet size={44} />
                      <h3>No products yet</h3>
                      <p>Click <strong>Add Product</strong> to add one, or <strong>Import Excel</strong> to upload your list</p>
                    </div>
                  </td></tr>
                ) : filtered.map((p) => {
                  const status = getStockStatus(p.quantity);
                  const margin = p.sellPrice > 0 ? Math.round(((p.sellPrice - p.buyPrice) / p.sellPrice) * 100) : 0;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><span className="badge badge-blue">{p.category.split(' ')[0]}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(p.buyPrice)}</td>
                      <td style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{formatCurrency(p.sellPrice)}</td>
                      <td><span style={{ color: 'var(--accent-green)', fontSize: '0.82rem', fontWeight: 600 }}>{margin}%</span></td>
                      <td>
                        <span style={{ fontWeight: 700, color: status.level === 'out' ? 'var(--accent-red)' : status.level === 'low' ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                          {p.quantity}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '4px' }}>/ min {p.minStock}</span>
                      </td>
                      <td><span className={`badge badge-${status.color}`}>{status.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(p)} title="Edit"><Edit2 size={14} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmId(p.id)} title="Delete" style={{ color: 'var(--accent-red-light)' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Showing {filtered.length} of {products.length} products
          </div>
        </div>
      </div>

      {/* ══ Add / Edit Modal ══ */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'Add New Product'}>
        <div className="grid-2">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Product Name *</label>
            <input className="form-input" placeholder="e.g. A4 White Paper (500 sheets)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <span style={{ color: 'var(--accent-red)', fontSize: '0.78rem' }}>{errors.name}</span>}
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Buy Price (RWF) *</label>
            <input className="form-input" type="number" min="0" placeholder="2500" value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} />
            {errors.buyPrice && <span style={{ color: 'var(--accent-red)', fontSize: '0.78rem' }}>{errors.buyPrice}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Sell Price (RWF) *</label>
            <input className="form-input" type="number" min="0" placeholder="3500" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} />
            {errors.sellPrice && <span style={{ color: 'var(--accent-red)', fontSize: '0.78rem' }}>{errors.sellPrice}</span>}
          </div>
          {!editing && (
            <div className="form-group">
              <label className="form-label">Initial Quantity *</label>
              <input className="form-input" type="number" min="0" placeholder="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              {errors.quantity && <span style={{ color: 'var(--accent-red)', fontSize: '0.78rem' }}>{errors.quantity}</span>}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Min Stock Alert</label>
            <input className="form-input" type="number" min="1" placeholder="5" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
          </div>
          {form.buyPrice && form.sellPrice && (
            <div style={{ gridColumn: '1 / -1', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Profit per unit: </span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{formatCurrency(Number(form.sellPrice) - Number(form.buyPrice))}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                ({form.sellPrice > 0 ? Math.round(((form.sellPrice - form.buyPrice) / form.sellPrice) * 100) : 0}% margin)
              </span>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Save Changes' : 'Add Product'}</button>
        </div>
      </Modal>

      {/* ══ Excel Import Preview Modal ══ */}
      <Modal isOpen={importModal} onClose={() => setImportModal(false)} title="Import Products from Excel" maxWidth="680px">
        {/* Summary bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--accent-green)' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--accent-green-light)', fontSize: '1.1rem' }}>{validCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ready to import</div>
            </div>
          </div>
          {invalidCount > 0 && (
            <div style={{ flex: 1, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={18} style={{ color: 'var(--accent-red)' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--accent-red-light)', fontSize: '1.1rem' }}>{invalidCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rows with issues</div>
              </div>
            </div>
          )}
          <div style={{ flex: 2, padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Tip:</strong> Only rows marked ✓ will be imported. Fix issues in your Excel file and re-upload to correct errors.
          </div>
        </div>

        {/* Error list */}
        {importErrors.length > 0 && (
          <div style={{ marginBottom: '12px', maxHeight: '80px', overflowY: 'auto', padding: '10px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--accent-red-light)' }}>
            {importErrors.map((e, i) => <div key={i}>⚠ {e}</div>)}
          </div>
        )}

        {/* Preview table */}
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Buy</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sell</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Qty</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>OK?</th>
              </tr>
            </thead>
            <tbody>
              {importRows.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No data found in file</td></tr>
              ) : importRows.map((r, i) => (
                <tr key={i} style={{ background: r.valid ? 'transparent' : 'rgba(239,68,68,0.04)', borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{r._line}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{r.category}</td>
                  <td style={{ padding: '8px 12px', color: r.buyPrice > 0 ? 'var(--text-secondary)' : 'var(--accent-red)' }}>{r.buyPrice > 0 ? formatCurrency(r.buyPrice) : '—'}</td>
                  <td style={{ padding: '8px 12px', color: r.sellPrice > 0 ? 'var(--accent-gold)' : 'var(--accent-red)', fontWeight: r.sellPrice > 0 ? 600 : 400 }}>{r.sellPrice > 0 ? formatCurrency(r.sellPrice) : '—'}</td>
                  <td style={{ padding: '8px 12px' }}>{r.quantity}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {r.valid
                      ? <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                      : <XCircle     size={16} style={{ color: 'var(--accent-red)'   }} />
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setImportModal(false)}>Cancel</button>
          <button
            className="btn btn-success"
            onClick={handleImportConfirm}
            disabled={validCount === 0 || importing}
          >
            {importing ? 'Importing…' : `Import ${validCount} Product${validCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </Modal>

      {/* ══ Delete Confirm ══ */}
      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => handleDelete(confirmId)}
        title="Delete Product"
        message="This will permanently delete the product. Sales history will remain. Are you sure?"
      />
    </div>
  );
}
