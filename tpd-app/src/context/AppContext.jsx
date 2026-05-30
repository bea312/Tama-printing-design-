import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllProducts } from '../services/productService';
import { getAllSales, getSalesSummary } from '../services/salesService';
import { getAllPurchases, getPurchaseSummary } from '../services/purchaseService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const refresh = useCallback(() => {
    setProducts(getAllProducts());
    setSales(getAllSales());
    setPurchases(getAllPurchases());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const salesSummary = getSalesSummary(sales);
  const purchaseSummary = getPurchaseSummary(purchases);
  const lowStockProducts = products.filter((p) => p.quantity <= p.minStock);
  const totalStockValue = products.reduce((s, p) => s + p.buyPrice * p.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        products, sales, purchases,
        salesSummary, purchaseSummary,
        lowStockProducts, totalStockValue,
        refresh,
        toasts, addToast, removeToast,
        sidebarOpen, setSidebarOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
