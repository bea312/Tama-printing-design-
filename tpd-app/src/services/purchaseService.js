import { getPurchases, savePurchases } from './storage';
import { generateId } from '../utils/helpers';
import { incrementStock, getProducts } from './productService';

export const getAllPurchases = () => getPurchases();

export const recordPurchase = (data) => {
  const products = getProducts();
  const product = products.find((p) => p.id === data.productId);
  if (!product) throw new Error('Product not found');

  incrementStock(data.productId, data.quantity);

  const purchase = {
    id: generateId(),
    productId: data.productId,
    productName: product.name,
    category: product.category,
    quantity: Number(data.quantity),
    buyPrice: Number(data.buyPrice) || product.buyPrice,
    totalCost: (Number(data.buyPrice) || product.buyPrice) * Number(data.quantity),
    supplier: data.supplier || '',
    note: data.note || '',
    date: data.date || new Date().toISOString(),
  };

  const purchases = getPurchases();
  purchases.push(purchase);
  savePurchases(purchases);
  return purchase;
};

export const deletePurchase = (id) => {
  const purchases = getPurchases().filter((p) => p.id !== id);
  savePurchases(purchases);
};

export const getPurchaseSummary = (purchases = getPurchases()) => {
  const totalSpent = purchases.reduce((s, x) => s + x.totalCost, 0);
  const totalQty = purchases.reduce((s, x) => s + x.quantity, 0);
  return { totalSpent, totalQty, count: purchases.length };
};
