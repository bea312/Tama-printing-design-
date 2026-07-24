import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDate } from '../utils/helpers';

export const exportToCSV = (data, filename) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};

export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  saveAs(blob, `${filename}.xlsx`);
};

export const exportSales = (sales, format = 'excel') => {
  const rows = sales.map((s) => ({
    Date: formatDate(s.date),
    Product: s.productName,
    Category: s.category,
    Qty: s.quantity,
    'Unit Price (RWF)': s.sellPrice,
    'Revenue (RWF)': s.totalRevenue,
    'Cost (RWF)': s.totalCost,
    'Profit (RWF)': s.profit,
    Quality: s.quality || '',
    Remark: s.remark || '',
    Payment: s.paymentMethod === 'momo' ? 'MoMo' : 'Cash',
    'Amount Paid (RWF)': s.amountPaid ?? s.totalRevenue,
    'Balance (RWF)': s.totalRevenue - (s.amountPaid ?? s.totalRevenue),
  }));
  const name = `TPD_Sales_${new Date().toISOString().slice(0, 10)}`;
  if (format === 'csv') exportToCSV(rows, name);
  else exportToExcel(rows, name, 'Sales');
};

export const exportPurchases = (purchases, format = 'excel') => {
  const rows = purchases.map((p) => ({
    Date: formatDate(p.date),
    Product: p.productName,
    Category: p.category,
    Qty: p.quantity,
    'Unit Cost (RWF)': p.buyPrice,
    'Total Cost (RWF)': p.totalCost,
    Quality: p.quality || '',
    Remark: p.remark || '',
  }));
  const name = `TPD_Purchases_${new Date().toISOString().slice(0, 10)}`;
  if (format === 'csv') exportToCSV(rows, name);
  else exportToExcel(rows, name, 'Purchases');
};

export const exportExpenses = (expenses, format = 'excel') => {
  const rows = expenses.map((e) => ({
    Date: formatDate(e.date),
    Category: e.category,
    Remark: e.remark || '',
    'Amount (RWF)': e.amount,
  }));
  const name = `TPD_Expenses_${new Date().toISOString().slice(0, 10)}`;
  if (format === 'csv') exportToCSV(rows, name);
  else exportToExcel(rows, name, 'Expenses');
};

export const exportInventory = (products, format = 'excel') => {
  const rows = products.map((p) => ({
    Name: p.name,
    Category: p.category,
    'Buy Price (RWF)': p.buyPrice,
    'Sell Price (RWF)': p.sellPrice,
    'Qty in Stock': p.quantity,
    'Min Stock': p.minStock,
    Status: p.quantity <= 0 ? 'Out of Stock' : p.quantity <= p.minStock ? 'Low Stock' : 'In Stock',
    'Stock Value (RWF)': p.buyPrice * p.quantity,
    Remark: p.latestRemark || '',
  }));
  const name = `TPD_Inventory_${new Date().toISOString().slice(0, 10)}`;
  if (format === 'csv') exportToCSV(rows, name);
  else exportToExcel(rows, name, 'Inventory');
};
