import { getSales, saveSales } from './storage';
import { generateId } from '../utils/helpers';
import { decrementStock, getProducts } from './productService';

export const getAllSales = () => getSales();

export const recordSale = (data) => {
  const products = getProducts();
  const product = products.find((p) => p.id === data.productId);
  if (!product) throw new Error('Product not found');
  if (product.quantity < Number(data.quantity))
    throw new Error(`Not enough stock. Available: ${product.quantity}`);

  const ok = decrementStock(data.productId, data.quantity);
  if (!ok) throw new Error('Failed to update stock');

  const totalRevenue = product.sellPrice * Number(data.quantity);
  const amountPaid = data.amountPaid !== '' && data.amountPaid != null ? Number(data.amountPaid) : totalRevenue;

  const sale = {
    id: generateId(),
    productId: data.productId,
    productName: product.name,
    category: product.category,
    quantity: Number(data.quantity),
    sellPrice: product.sellPrice,
    buyPrice: product.buyPrice,
    totalRevenue,
    totalCost: product.buyPrice * Number(data.quantity),
    profit: (product.sellPrice - product.buyPrice) * Number(data.quantity),
    quality: data.quality || '',
    remark: data.remark || '',
    paymentMethod: data.paymentMethod || 'cash',
    amountPaid,
    date: data.date || new Date().toISOString(),
  };

  const sales = getSales();
  sales.push(sale);
  saveSales(sales);
  return sale;
};

export const deleteSale = (id) => {
  const sales = getSales().filter((s) => s.id !== id);
  saveSales(sales);
};

export const getSalesSummary = (sales = getSales()) => {
  const totalRevenue = sales.reduce((s, x) => s + x.totalRevenue, 0);
  const totalCost = sales.reduce((s, x) => s + x.totalCost, 0);
  const totalProfit = sales.reduce((s, x) => s + x.profit, 0);
  const totalQty = sales.reduce((s, x) => s + x.quantity, 0);
  return { totalRevenue, totalCost, totalProfit, totalQty, count: sales.length };
};
