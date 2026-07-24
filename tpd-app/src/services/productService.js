import { getProducts as _getProducts, saveProducts } from './storage';
import { generateId, CATEGORIES } from '../utils/helpers';

const safeCategory = (cat) => cat && cat.trim() ? cat.trim() : CATEGORIES[CATEGORIES.length - 1];

export const getProducts = () => _getProducts();
export const getAllProducts = () => _getProducts();

export const addProduct = (data) => {
  const products = _getProducts();
  const product = {
    id: generateId(),
    name: data.name.trim(),
    category: safeCategory(data.category),
    buyPrice: Number(data.buyPrice),
    sellPrice: Number(data.sellPrice),
    quantity: Number(data.quantity) || 0,
    minStock: Number(data.minStock) || 5,
    createdAt: new Date().toISOString(),
  };
  products.push(product);
  saveProducts(products);
  return product;
};

export const updateProduct = (id, data) => {
  const products = _getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  products[idx] = {
    ...products[idx],
    name: data.name.trim(),
    category: safeCategory(data.category),
    buyPrice: Number(data.buyPrice),
    sellPrice: Number(data.sellPrice),
    minStock: Number(data.minStock) || 5,
    updatedAt: new Date().toISOString(),
  };
  saveProducts(products);
  return products[idx];
};

export const deleteProduct = (id) => {
  const products = _getProducts().filter((p) => p.id !== id);
  saveProducts(products);
};

export const incrementStock = (id, qty) => {
  const products = _getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  products[idx].quantity += Number(qty);
  saveProducts(products);
  return true;
};

export const decrementStock = (id, qty) => {
  const products = _getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  if (products[idx].quantity < Number(qty)) return false;
  products[idx].quantity -= Number(qty);
  saveProducts(products);
  return true;
};

export const getLowStockProducts = () =>
  _getProducts().filter((p) => p.quantity <= p.minStock);
