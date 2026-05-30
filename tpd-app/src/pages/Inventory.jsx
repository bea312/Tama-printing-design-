import { useState, useMemo } from 'react';
import { Search, Warehouse, AlertTriangle, Download, ArrowUpDown } from 'lucide-react';
import Header from '../components/common/Header';
import { useApp } from '../context/AppContext';
import { exportInventory } from '../services/exportService';
import { formatCurrency, getStockStatus, getStockBarLevel, CATEGORIES } from '../utils/helpers';

export default function Inventory() {
  const { products, totalStockValue } = useApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState('quantity');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchCat = !catFilter || p.category === catFilter;
      const status = getStockStatus(p.quantity);
      const matchStatus = !statusFilter || status.level === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? av - bv : bv - av;
    });
    return list;
  }, [products, search, catFilter, statusFilter, sortKey, sortAsc]);

  const lowCount = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock).length;
  const outCount = products.filter((p) => p.quantity === 0).length;
  const totalItems = products.reduce((s, p) => s + p.quantity, 0);

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortTh = ({ k, label }) => (
    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort(k)}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {label}
        <ArrowUpDown size={11} style={{ opacity: sortKey === k ? 1 : 0.3, color: sortKey === k ? 'var(--brand-blue-light)' : undefined }} />
      </span>
    </th>
  );

  return (
    <div>
      <Header title="Inventory" subtitle="Monitor stock levels and availability" />
      <div className="page-wrapper">
        {/* Summary */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          {[
            { label: 'Total Products', value: products.length, color: 'var(--brand-blue-light)' },
            { label: 'Total Stock Units', value: totalItems, color: 'var(--accent-cyan)' },
            { label: 'Stock Value', value: formatCurrency(totalStockValue), color: 'var(--accent-gold)' },
            { label: 'Alerts', value: `${outCount} out · ${lowCount} low`, color: 'var(--accent-red)' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>{s.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Poppins', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Low stock alerts */}
        {(outCount > 0 || lowCount > 0) && (
          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {outCount > 0 && (
              <div className="alert alert-danger">
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <strong>{outCount} product{outCount > 1 ? 's' : ''} out of stock</strong> — restock soon to avoid lost sales.
              </div>
            )}
            {lowCount > 0 && (
              <div className="alert alert-warning">
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <strong>{lowCount} product{lowCount > 1 ? 's' : ''} running low</strong> — consider restocking.
              </div>
            )}
          </div>
        )}

        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-bar" style={{ width: '220px' }}>
              <Search size={15} className="search-icon" />
              <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: '160px', height: '40px' }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-select" style={{ width: '150px', height: '40px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="high">In Stock</option>
              <option value="medium">Medium</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-ghost" onClick={() => exportInventory(filtered, 'csv')}>
              <Download size={14} /> CSV
            </button>
            <button className="btn btn-ghost" onClick={() => exportInventory(filtered)}>
              <Download size={14} /> Excel
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <SortTh k="name" label="Product" />
                  <th>Category</th>
                  <SortTh k="quantity" label="Stock" />
                  <th>Min Stock</th>
                  <th style={{ minWidth: '120px' }}>Level</th>
                  <SortTh k="buyPrice" label="Buy Price" />
                  <SortTh k="sellPrice" label="Sell Price" />
                  <th>Stock Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9}>
                    <div className="empty-state"><Warehouse size={40} /><h3>No products match</h3><p>Adjust your filters</p></div>
                  </td></tr>
                ) : filtered.map((p) => {
                  const status = getStockStatus(p.quantity);
                  const bar = getStockBarLevel(p.quantity, Math.max(p.quantity, p.minStock * 4, 20));
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><span className="badge badge-blue">{p.category.split(' ')[0]}</span></td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: p.quantity === 0 ? 'var(--accent-red)' : p.quantity <= p.minStock ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                          {p.quantity}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.minStock}</td>
                      <td>
                        <div className="stock-bar">
                          <div className={`stock-bar-fill ${bar.cls}`} style={{ width: `${bar.pct}%` }} />
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{Math.round(bar.pct)}%</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(p.buyPrice)}</td>
                      <td style={{ color: 'var(--accent-gold)' }}>{formatCurrency(p.sellPrice)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{formatCurrency(p.buyPrice * p.quantity)}</td>
                      <td><span className={`badge badge-${status.color}`}>{status.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Showing {filtered.length} of {products.length} products</span>
            <span>Total stock value: <strong style={{ color: 'var(--accent-gold)' }}>{formatCurrency(filtered.reduce((s, p) => s + p.buyPrice * p.quantity, 0))}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
