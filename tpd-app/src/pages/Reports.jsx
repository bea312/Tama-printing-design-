import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';
import { Download, BarChart3, TrendingUp, DollarSign, ShoppingCart, Wallet } from 'lucide-react';
import Header from '../components/common/Header';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { exportSales, exportPurchases } from '../services/exportService';
import { formatCurrency, formatDate, filterByDateRange } from '../utils/helpers';

const RANGES = [
  { key: 'today', value: 'today' },
  { key: 'thisWeek', value: 'week' },
  { key: 'thisMonth', value: 'month' },
  { key: 'thisYear', value: 'year' },
  { key: 'allTime', value: 'all' },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.82rem' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.fill || p.stroke, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{typeof p.value === 'number' && p.value > 100 ? formatCurrency(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Reports() {
  const { sales, purchases, expenses } = useApp();
  const { t } = useLanguage();
  const [range, setRange] = useState('month');

  const filteredSales = useMemo(() => filterByDateRange(sales, range), [sales, range]);
  const filteredPurchases = useMemo(() => filterByDateRange(purchases, range), [purchases, range]);
  const filteredExpenses = useMemo(() => filterByDateRange(expenses, range), [expenses, range]);

  const summary = useMemo(() => {
    const revenue = filteredSales.reduce((s, x) => s + x.totalRevenue, 0);
    const profit = filteredSales.reduce((s, x) => s + x.profit, 0);
    const expensesTotal = filteredExpenses.reduce((s, x) => s + x.amount, 0);
    return {
      revenue,
      cost: filteredSales.reduce((s, x) => s + x.totalCost, 0),
      profit,
      salesCount: filteredSales.length,
      purchased: filteredPurchases.reduce((s, x) => s + x.totalCost, 0),
      margin: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
      expensesTotal,
      netProfit: profit - expensesTotal,
    };
  }, [filteredSales, filteredPurchases, filteredExpenses]);

  /* Group sales by date for chart */
  const dailyData = useMemo(() => {
    const days = {};
    filteredSales.forEach((s) => {
      const key = formatDate(s.date);
      if (!days[key]) days[key] = { date: key, revenue: 0, profit: 0, sales: 0 };
      days[key].revenue += s.totalRevenue;
      days[key].profit += s.profit;
      days[key].sales += s.quantity;
    });
    return Object.values(days);
  }, [filteredSales]);

  /* Top products */
  const topProducts = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      if (!map[s.productName]) map[s.productName] = { name: s.productName.split(' ').slice(0, 3).join(' '), revenue: 0, profit: 0, qty: 0 };
      map[s.productName].revenue += s.totalRevenue;
      map[s.productName].profit += s.profit;
      map[s.productName].qty += s.quantity;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [filteredSales]);

  return (
    <div>
      <Header title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <div className="page-wrapper">
        {/* Range filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {RANGES.map((r) => (
            <button
              key={r.value}
              className={`btn ${range === r.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setRange(r.value)}
            >
              {t(`reports.${r.key}`)}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => exportSales(filteredSales, 'csv')}>
              <Download size={13} /> {t('reports.salesCsv')}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => exportSales(filteredSales)}>
              <Download size={13} /> {t('reports.salesExcel')}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => exportPurchases(filteredPurchases)}>
              <Download size={13} /> {t('reports.purchasesExcel')}
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid-4" style={{ marginBottom: '16px' }}>
          {[
            { label: t('reports.revenue'), value: formatCurrency(summary.revenue), icon: DollarSign, color: 'gold' },
            { label: t('reports.profit'), value: formatCurrency(summary.profit), icon: TrendingUp, color: 'green' },
            { label: t('reports.margin'), value: `${summary.margin}%`, icon: BarChart3, color: 'blue' },
            { label: t('reports.sales'), value: summary.salesCount, icon: ShoppingCart, color: 'purple' },
          ].map((k) => (
            <div key={k.label} className={`stat-card ${k.color}`}>
              <div className={`stat-icon ${k.color}`}><k.icon size={20} /></div>
              <div className="stat-label">{k.label}</div>
              <div className="stat-value" style={{ fontSize: '1.4rem' }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: '24px' }}>
          <div className="stat-card red">
            <div className="stat-icon red"><Wallet size={20} /></div>
            <div className="stat-label">{t('expenses.totalExpenses')}</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{formatCurrency(summary.expensesTotal)}</div>
          </div>
          <div className={`stat-card ${summary.netProfit >= 0 ? 'green' : 'red'}`}>
            <div className={`stat-icon ${summary.netProfit >= 0 ? 'green' : 'red'}`}><TrendingUp size={20} /></div>
            <div className="stat-label">{t('dashboard.netProfit')}</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{formatCurrency(summary.netProfit)}</div>
          </div>
        </div>

        {/* Revenue & Profit trend */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <span className="card-title">{t('reports.revenueProfitTrend')}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t(`reports.${RANGES.find((r) => r.value === range)?.key}`)}</span>
          </div>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
                <Line type="monotone" dataKey="revenue" name={t('reports.revenue')} stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="profit" name={t('reports.profit')} stroke="#10b981" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}><BarChart3 size={40} /><h3>{t('reports.noDataPeriod')}</h3></div>
          )}
        </div>

        {/* Top products bar chart */}
        {topProducts.length > 0 && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <span className="card-title">{t('reports.topProducts')}</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProducts} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
                <Bar dataKey="revenue" name={t('reports.revenue')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name={t('reports.profit')} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Detailed sales table */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <span className="card-title">{t('reports.salesDetail')}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{filteredSales.length} {t('reports.records')}</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('common.product')}</th>
                  <th>{t('reports.qty')}</th>
                  <th>{t('reports.revenue')}</th>
                  <th>{t('reports.cost')}</th>
                  <th>{t('reports.profit')}</th>
                  <th>{t('reports.margin')}</th>
                  <th>{t('stockOut.quality')}</th>
                  <th>{t('common.date')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state" style={{ padding: '40px' }}><ShoppingCart size={36} /><h3>{t('reports.noSalesPeriod')}</h3></div></td></tr>
                ) : [...filteredSales].sort((a, b) => new Date(b.date) - new Date(a.date)).map((s) => {
                  const m = s.totalRevenue > 0 ? Math.round((s.profit / s.totalRevenue) * 100) : 0;
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.productName}</td>
                      <td>{s.quantity}</td>
                      <td style={{ color: 'var(--accent-gold)' }}>{formatCurrency(s.totalRevenue)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(s.totalCost)}</td>
                      <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{formatCurrency(s.profit)}</td>
                      <td><span style={{ color: m >= 20 ? 'var(--accent-green)' : 'var(--accent-gold)', fontSize: '0.82rem', fontWeight: 600 }}>{m}%</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.quality || '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatDate(s.date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredSales.length > 0 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '24px', fontSize: '0.82rem', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('reports.total')}</span>
              <span><span style={{ color: 'var(--text-muted)' }}>{t('reports.revenue')} </span><strong style={{ color: 'var(--accent-gold)' }}>{formatCurrency(summary.revenue)}</strong></span>
              <span><span style={{ color: 'var(--text-muted)' }}>{t('reports.cost')} </span><strong style={{ color: 'var(--text-secondary)' }}>{formatCurrency(summary.cost)}</strong></span>
              <span><span style={{ color: 'var(--text-muted)' }}>{t('reports.profit')} </span><strong style={{ color: 'var(--accent-green)' }}>{formatCurrency(summary.profit)}</strong></span>
              <span><span style={{ color: 'var(--text-muted)' }}>{t('expenses.totalExpenses')} </span><strong style={{ color: 'var(--accent-red-light)' }}>{formatCurrency(summary.expensesTotal)}</strong></span>
              <span><span style={{ color: 'var(--text-muted)' }}>{t('dashboard.netProfit')} </span><strong style={{ color: summary.netProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red-light)' }}>{formatCurrency(summary.netProfit)}</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
