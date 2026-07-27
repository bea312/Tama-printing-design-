import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getAllProducts } from '../services/productService';
import { getAllSales, getSalesSummary } from '../services/salesService';
import { getAllPurchases, getPurchaseSummary } from '../services/purchaseService';
import { getAllExpenses, getExpenseSummary } from '../services/expenseService';
import { onRemoteDataChange } from '../services/storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [products, setProducts] = useState(getAllProducts);
  const [sales, setSales] = useState(getAllSales);
  const [purchases, setPurchases] = useState(getAllPurchases);
  const [expenses, setExpenses] = useState(getAllExpenses);
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const refresh = useCallback(() => {
    setProducts(getAllProducts());
    setSales(getAllSales());
    setPurchases(getAllPurchases());
    setExpenses(getAllExpenses());
  }, []);

  /* When cloud sync is on, another device writing under the same account pushes a
     Firestore snapshot here — pull it into local state so this tab reflects it live. */
  useEffect(() => {
    onRemoteDataChange(refresh);
    return () => onRemoteDataChange(null);
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
  const expenseSummary = getExpenseSummary(expenses);
  const lowStockProducts = products.filter((p) => p.quantity <= p.minStock);
  const totalStockValue = products.reduce((s, p) => s + p.buyPrice * p.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        products, sales, purchases, expenses,
        salesSummary, purchaseSummary, expenseSummary,
        lowStockProducts, totalStockValue,
        refresh,
        toasts, addToast, removeToast,
        sidebarOpen, setSidebarOpen,
        mobileNavOpen, setMobileNavOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook lives alongside its Provider by design, consistent across every context in this app
export const useApp = () => useContext(AppContext);
