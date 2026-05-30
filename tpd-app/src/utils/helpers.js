export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

export const getStockStatus = (qty) => {
  if (qty <= 0) return { label: 'Out of Stock', color: 'red', level: 'out' };
  if (qty < 5) return { label: 'Low Stock', color: 'red', level: 'low' };
  if (qty < 20) return { label: 'Medium', color: 'gold', level: 'medium' };
  return { label: 'In Stock', color: 'green', level: 'high' };
};

export const getStockBarLevel = (qty, max = 100) => {
  if (qty <= 0) return { pct: 0, cls: 'low' };
  const pct = Math.min((qty / max) * 100, 100);
  if (qty < 5) return { pct, cls: 'low' };
  if (qty < 20) return { pct, cls: 'medium' };
  return { pct, cls: 'high' };
};

export const getDaysAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

export const filterByDateRange = (items, range, dateField = 'date') => {
  const now = new Date();
  const start = new Date();
  if (range === 'today') { start.setHours(0, 0, 0, 0); }
  else if (range === 'week') { start.setDate(now.getDate() - 7); }
  else if (range === 'month') { start.setMonth(now.getMonth() - 1); }
  else if (range === 'year') { start.setFullYear(now.getFullYear() - 1); }
  else return items;
  return items.filter((i) => new Date(i[dateField]) >= start);
};

export const groupByDate = (items, dateField = 'date') => {
  const groups = {};
  items.forEach((item) => {
    const key = new Date(item[dateField]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
};

export const CATEGORIES = [
  'Paper & Cardstock',
  'Printing Ink',
  'Toner & Cartridges',
  'Stationery',
  'Binding & Lamination',
  'Envelopes & Folders',
  'Pens & Markers',
  'Labels & Stickers',
  'Other',
];
