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
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, formatDate, getStockStatus, filterByDateRange } from '../utils/helpers';

export default function Dashboard() {
  const { products, sales, salesSummary, totalStockValue, lowStockProducts } = useApp();
  const { t } = useLanguage();
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
      <Header title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <div className="page-wrapper">

        {/* Low stock alert banner */}
        {lowStockProducts.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: '24px', cursor: 'pointer' }} onClick={() => navigate('/inventory')}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>{lowStockProducts.length} {t('common.product')}{lowStockProducts.length > 1 ? 's' : ''}</strong> {t('dashboard.runningLow')}{' '}
              <strong style={{ textDecoration: 'underline' }}>{t('dashboard.viewInventory')}</strong>
            </span>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <StatCard label={t('dashboard.totalProducts')} value={products.length} icon={Package} color="blue" />
          <StatCard label={t('dashboard.totalSales')} value={salesSummary.count} icon={ShoppingCart} color="green" />
          <StatCard label={t('dashboard.totalRevenue')} value={formatCurrency(salesSummary.totalRevenue)} icon={DollarSign} color="gold" />
          <StatCard label={t('dashboard.netProfit')} value={formatCurrency(salesSummary.totalProfit)} icon={TrendingUp} color="purple" />
        </div>

        <div className="grid-2" style={{ marginBottom: '24px', gap: '20px' }}>
          <StatCard label={t('dashboard.stockValue')} value={formatCurrency(totalStockValue)} icon={Warehouse} color="cyan" />
          <StatCard label={t('dashboard.lowStockAlerts')} value={lowStockProducts.length} icon={AlertTriangle} color="red" />
        </div>

        {/* Charts row */}
        <div className="grid-2" style={{ marginBottom: '24px', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">{t('dashboard.salesProfitTrend')}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reports')}>
                {t('dashboard.viewReport')} <ArrowRight size={13} />
              </button>
            </div>
            {chartData.length > 0
              ? <SalesChart data={chartData} revenueLabel={t('dashboard.revenue')} profitLabel={t('dashboard.profit')} />
              : <div className="empty-state" style={{ padding: '40px' }}><BarChart2 size={36} /><h3>{t('dashboard.noSalesData')}</h3><p>{t('dashboard.recordFirstSale')}</p></div>
            }
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">{t('dashboard.productsByCategory')}</span>
            </div>
            {categoryData.length > 0
              ? <CategoryChart data={categoryData} />
              : <div className="empty-state" style={{ padding: '40px' }}><Package size={36} /><h3>{t('dashboard.noProductsYet')}</h3><p>{t('dashboard.addProductsToSee')}</p></div>
            }
          </div>
        </div>

        {/* Recent sales table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">{t('dashboard.recentSales')}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/stock-out')}>
              {t('dashboard.viewAll')} <ArrowRight size={13} />
            </button>
          </div>
          {recentSales.length === 0 ? (
            <div className="empty-state"><ShoppingCart size={36} /><h3>{t('dashboard.noSalesRecorded')}</h3><p>{t('dashboard.goToStockOut')}</p></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{t('common.product')}</th>
                    <th>{t('common.category')}</th>
                    <th>{t('dashboard.qty')}</th>
                    <th>{t('dashboard.revenue')}</th>
                    <th>{t('dashboard.profit')}</th>
                    <th>{t('common.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.productName}</td>
                      <td><span className="badge badge-blue">{(s.category || 'Other').split(' ')[0]}</span></td>
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
                {t('dashboard.lowStockItems')}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/inventory')}>
                {t('dashboard.manage')} <ArrowRight size={13} />
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
                      <span className={`badge badge-${status.color}`}>{p.quantity === 0 ? t('dashboard.outOfStock') : `${p.quantity} ${t('dashboard.left')}`}</span>
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
