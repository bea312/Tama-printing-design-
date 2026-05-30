import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, TrendingUp, DollarSign, BarChart2,
  AlertTriangle, ArrowRight, ShoppingCart, Warehouse,
} from 'lucide-react';
import Header from '../components/common/Header';
import StatCard from '../components/common/StatCard';
import SalesChart from '../components/charts/SalesChart';
import CategoryChart from '../components/charts/CategoryChart';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getStockStatus, filterByDateRange } from '../utils/helpers';

export default function Dashboard() {
  const { products, sales, purchases, salesSummary, totalStockValue, lowStockProducts } = useApp();
  const navigate = useNavigate();

  const chartData = useMemo(() => {
    const last7 = filterByDateRange(sales, 'week');
    const byDay = {};
    last7.forEach((s) => {
      const key = formatDate(s.date);
      if (!byDay[key]) byDay[key] = { date: key, revenue: 0, profit: 0 };
      byDay[key].revenue += s.totalRevenue;
      byDay[key].profit += s.profit;
    });
    return Object.values(byDay).slice(-7);
  }, [sales]);

  const categoryData = useMemo(() => {
    const cats = {};
    products.forEach((p) => {
      cats[p.category] = (cats[p.category] || 0) + 1;
    });
    const total = products.length || 1;
    return Object.entries(cats).map(([name, value]) => ({
      name: name.split(' ')[0],
      value,
      pct: Math.round((value / total) * 100),
    }));
  }, [products]);

  const recentSales = useMemo(() => [...sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5), [sales]);

  return (
    <div>
      <Header title="Dashboard" subtitle="Welcome back — here's your business overview" />
      <div className="page-wrapper">

        {/* Low stock alert banner */}
        {lowStockProducts.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: '24px', cursor: 'pointer' }} onClick={() => navigate('/inventory')}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>{lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''}</strong> {lowStockProducts.length > 1 ? 'are' : 'is'} running low on stock —{' '}
              <strong style={{ textDecoration: 'underline' }}>View inventory</strong>
            </span>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <StatCard label="Total Products" value={products.length} icon={Package} color="blue" />
          <StatCard label="Total Sales" value={salesSummary.count} icon={ShoppingCart} color="green" />
          <StatCard label="Total Revenue" value={formatCurrency(salesSummary.totalRevenue)} icon={DollarSign} color="gold" />
          <StatCard label="Net Profit" value={formatCurrency(salesSummary.totalProfit)} icon={TrendingUp} color="purple" />
        </div>

        <div className="grid-2" style={{ marginBottom: '24px', gap: '20px' }}>
          <StatCard label="Stock Value" value={formatCurrency(totalStockValue)} icon={Warehouse} color="cyan" />
          <StatCard label="Low Stock Alerts" value={lowStockProducts.length} icon={AlertTriangle} color="red" />
        </div>

        {/* Charts row */}
        <div className="grid-2" style={{ marginBottom: '24px', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Sales & Profit — Last 7 Days</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reports')}>
                View Report <ArrowRight size={13} />
              </button>
            </div>
            {chartData.length > 0
              ? <SalesChart data={chartData} />
              : <div className="empty-state" style={{ padding: '40px' }}><BarChart2 size={36} /><h3>No sales data yet</h3><p>Record your first sale to see charts</p></div>
            }
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Products by Category</span>
            </div>
            {categoryData.length > 0
              ? <CategoryChart data={categoryData} />
              : <div className="empty-state" style={{ padding: '40px' }}><Package size={36} /><h3>No products yet</h3><p>Add products to see distribution</p></div>
            }
          </div>
        </div>

        {/* Recent sales table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Sales</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/stock-out')}>
              View All <ArrowRight size={13} />
            </button>
          </div>
          {recentSales.length === 0 ? (
            <div className="empty-state"><ShoppingCart size={36} /><h3>No sales recorded</h3><p>Go to Stock Out to record a sale</p></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.productName}</td>
                      <td><span className="badge badge-blue">{s.category.split(' ')[0]}</span></td>
                      <td>{s.quantity}</td>
                      <td style={{ color: 'var(--accent-gold)' }}>{formatCurrency(s.totalRevenue)}</td>
                      <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{formatCurrency(s.profit)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatDate(s.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low stock list */}
        {lowStockProducts.length > 0 && (
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <span className="card-title" style={{ color: 'var(--accent-red-light)' }}>
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Low Stock Items
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/inventory')}>
                Manage <ArrowRight size={13} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {lowStockProducts.map((p) => {
                const status = getStockStatus(p.quantity);
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid var(--accent-${status.color})` }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.category}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${status.color}`}>{p.quantity === 0 ? 'Out of Stock' : `${p.quantity} left`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
