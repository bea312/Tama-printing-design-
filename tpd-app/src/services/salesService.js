import { getSales, saveSales } from './storage';
import { generateId } from '../utils/helpers';
import { decrementStock, incrementStock, getProducts } from './productService';

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

  const hasCash = data.cashAmount !== '' && data.cashAmount != null;
  const hasMomo = data.momoAmount !== '' && data.momoAmount != null;
  let cashAmount = hasCash ? Number(data.cashAmount) : 0;
  const momoAmount = hasMomo ? Number(data.momoAmount) : 0;
  if (!hasCash && !hasMomo) cashAmount = totalRevenue; // default: fully paid in cash
  const amountPaid = cashAmount + momoAmount;
  const paymentMethod = cashAmount > 0 && momoAmount > 0 ? 'split' : momoAmount > 0 ? 'momo' : 'cash';

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
    paymentMethod,
    cashAmount,
    momoAmount,
    amountPaid,
    date: data.date || new Date().toISOString(),
  };

  const sales = getSales();
  sales.push(sale);
  saveSales(sales);
  return sale;
};

/* Edits quantity/quality/remark/payment/date on an existing sale, keeping the sale's
   original sellPrice/buyPrice (locked in at the time of sale) and adjusting stock by
   the difference in quantity. The product itself can't be changed. */
export const updateSale = (id, data) => {
  const sales = getSales();
  const idx = sales.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Sale not found');
  const sale = sales[idx];

  const newQuantity = Number(data.quantity);
  const delta = newQuantity - sale.quantity;
  if (delta > 0) {
    const ok = decrementStock(sale.productId, delta);
    if (!ok) throw new Error('Not enough stock for this quantity');
  } else if (delta < 0) {
    incrementStock(sale.productId, -delta);
  }

  const totalRevenue = sale.sellPrice * newQuantity;
  const totalCost = sale.buyPrice * newQuantity;
  const profit = (sale.sellPrice - sale.buyPrice) * newQuantity;

  const hasCash = data.cashAmount !== '' && data.cashAmount != null;
  const hasMomo = data.momoAmount !== '' && data.momoAmount != null;
  let cashAmount = hasCash ? Number(data.cashAmount) : 0;
  const momoAmount = hasMomo ? Number(data.momoAmount) : 0;
  if (!hasCash && !hasMomo) cashAmount = totalRevenue;
  const amountPaid = cashAmount + momoAmount;
  const paymentMethod = cashAmount > 0 && momoAmount > 0 ? 'split' : momoAmount > 0 ? 'momo' : 'cash';

  sales[idx] = {
    ...sale,
    quantity: newQuantity,
    totalRevenue,
    totalCost,
    profit,
    quality: data.quality || '',
    remark: data.remark || '',
    paymentMethod,
    cashAmount,
    momoAmount,
    amountPaid,
    date: data.date || sale.date,
  };
  saveSales(sales);
  return sales[idx];
};

/* Cash/MoMo breakdown for a sale, tolerant of records saved before the split-payment
   fields existed (those only had paymentMethod + amountPaid). */
export const getSalePayment = (s) => {
  const paid = s.amountPaid ?? s.totalRevenue;
  const cashAmount = s.cashAmount ?? (s.paymentMethod === 'momo' ? 0 : paid);
  const momoAmount = s.momoAmount ?? (s.paymentMethod === 'momo' ? paid : 0);
  return { cashAmount, momoAmount, paid, balance: s.totalRevenue - paid };
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
