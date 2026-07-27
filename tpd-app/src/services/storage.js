import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { generateId } from '../utils/helpers';
import { db, firebaseEnabled, authReady } from './firebase';

const KEYS = {
  PRODUCTS: 'tpd_products',
  SALES: 'tpd_sales',
  PURCHASES: 'tpd_purchases',
  EXPENSES: 'tpd_expenses',
  AUTH: 'tpd_auth',
  USERS: 'tpd_users',
  EMPLOYEES: 'tpd_employees',
};

const get = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const set = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
};

/* Per-account data namespace — each email keeps its own products/sales/purchases */
let accountNamespace = null;
const nsKey = (key) => (accountNamespace ? `${key}::${accountNamespace}` : key);

/* --- Cloud sync (Firestore), only active once VITE_FIREBASE_* keys are configured ---
   The local key/value store above stays the synchronous source of truth the rest of
   the app reads from; Firestore is a write-through mirror plus a realtime listener that
   pulls in changes made from another device/browser under the same account email. */
const CLOUD_FIELDS = {
  [KEYS.PRODUCTS]: 'products',
  [KEYS.SALES]: 'sales',
  [KEYS.PURCHASES]: 'purchases',
  [KEYS.EXPENSES]: 'expenses',
};

let unsubscribeRemote = null;
let onRemoteChangeCb = null;

/* Registered by AppContext so it can refresh its state when data arrives from
   another device. */
export const onRemoteDataChange = (cb) => { onRemoteChangeCb = cb; };

const syncRemote = (key, value) => {
  const field = CLOUD_FIELDS[key];
  if (!field || !firebaseEnabled || !accountNamespace) return;
  setDoc(doc(db, 'accounts', accountNamespace), { [field]: value }, { merge: true })
    .catch((e) => console.error('Cloud sync error:', e));
};

export const setActiveAccount = (email) => {
  accountNamespace = email || null;
  if (unsubscribeRemote) { unsubscribeRemote(); unsubscribeRemote = null; }
  if (!firebaseEnabled || !accountNamespace) return;

  const target = accountNamespace;
  authReady.then(() => {
    if (accountNamespace !== target) return; // account switched again before auth settled
    unsubscribeRemote = onSnapshot(
      doc(db, 'accounts', target),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        let changed = false;
        Object.entries(CLOUD_FIELDS).forEach(([key, field]) => {
          if (data[field] !== undefined) {
            set(`${key}::${target}`, data[field]);
            changed = true;
          }
        });
        if (changed) onRemoteChangeCb?.();
      },
      (err) => console.error('Cloud sync listener error:', err)
    );
  });
};

export const getProducts = () => get(nsKey(KEYS.PRODUCTS)) || [];
export const saveProducts = (products) => { set(nsKey(KEYS.PRODUCTS), products); syncRemote(KEYS.PRODUCTS, products); };

export const getSales = () => get(nsKey(KEYS.SALES)) || [];
export const saveSales = (sales) => { set(nsKey(KEYS.SALES), sales); syncRemote(KEYS.SALES, sales); };

export const getPurchases = () => get(nsKey(KEYS.PURCHASES)) || [];
export const savePurchases = (purchases) => { set(nsKey(KEYS.PURCHASES), purchases); syncRemote(KEYS.PURCHASES, purchases); };

export const getExpenses = () => get(nsKey(KEYS.EXPENSES)) || [];
export const saveExpenses = (expenses) => { set(nsKey(KEYS.EXPENSES), expenses); syncRemote(KEYS.EXPENSES, expenses); };

export const getAuth = () => get(KEYS.AUTH);
export const saveAuth = (auth) => set(KEYS.AUTH, auth);
export const clearAuth = () => localStorage.removeItem(KEYS.AUTH);

/* Local-only fallback account/employee directories, used when Firebase isn't
   configured (AuthContext and teamService go straight to Firebase Auth/Firestore
   for these when cloud sync is enabled). */
export const getUsers = () => get(KEYS.USERS) || [];
export const saveUsers = (users) => set(KEYS.USERS, users);

export const getEmployees = () => get(KEYS.EMPLOYEES) || [];
export const saveEmployees = (employees) => set(KEYS.EMPLOYEES, employees);

/* Wipe all product/sales/purchase/expense data for the active account (keep auth & other accounts) */
export const clearAllData = () => {
  localStorage.removeItem(nsKey(KEYS.PRODUCTS));
  localStorage.removeItem(nsKey(KEYS.SALES));
  localStorage.removeItem(nsKey(KEYS.PURCHASES));
  localStorage.removeItem(nsKey(KEYS.EXPENSES));
  if (firebaseEnabled && accountNamespace) {
    setDoc(doc(db, 'accounts', accountNamespace), { products: [], sales: [], purchases: [], expenses: [] }, { merge: true })
      .catch((e) => console.error('Cloud sync error:', e));
  }
};

export const seedDemoData = () => {
  if (getProducts().length > 0) return;

  const now = new Date();
  const daysAgo = (n) => new Date(now - n * 86400000).toISOString();

  const products = [
    { id: generateId(), name: 'A4 White Paper (500 sheets)', category: 'Paper & Cardstock', buyPrice: 2500, sellPrice: 3500, quantity: 80, minStock: 10, createdAt: daysAgo(30) },
    { id: generateId(), name: 'HP 680 Black Ink Cartridge', category: 'Toner & Cartridges', buyPrice: 8000, sellPrice: 12000, quantity: 15, minStock: 5, createdAt: daysAgo(25) },
    { id: generateId(), name: 'HP 680 Color Ink Cartridge', category: 'Toner & Cartridges', buyPrice: 9000, sellPrice: 14000, quantity: 3, minStock: 5, createdAt: daysAgo(25) },
    { id: generateId(), name: 'A3 Glossy Photo Paper', category: 'Paper & Cardstock', buyPrice: 5000, sellPrice: 7500, quantity: 40, minStock: 10, createdAt: daysAgo(20) },
    { id: generateId(), name: 'Stapler (Heavy Duty)', category: 'Stationery', buyPrice: 3500, sellPrice: 5500, quantity: 12, minStock: 3, createdAt: daysAgo(18) },
    { id: generateId(), name: 'Binding Wire A4', category: 'Binding & Lamination', buyPrice: 4500, sellPrice: 6500, quantity: 25, minStock: 5, createdAt: daysAgo(15) },
    { id: generateId(), name: 'Lamination Film A4', category: 'Binding & Lamination', buyPrice: 3000, sellPrice: 4500, quantity: 0, minStock: 10, createdAt: daysAgo(12) },
    { id: generateId(), name: 'Blue Ballpoint Pens (Box 50)', category: 'Pens & Markers', buyPrice: 2000, sellPrice: 3000, quantity: 8, minStock: 5, createdAt: daysAgo(10) },
  ];
  saveProducts(products);

  const sales = [
    { id: generateId(), productId: products[0].id, productName: products[0].name, category: products[0].category, quantity: 5, sellPrice: 3500, buyPrice: 2500, totalRevenue: 17500, totalCost: 12500, profit: 5000, customerName: 'Kigali School', note: '', date: daysAgo(6) },
    { id: generateId(), productId: products[1].id, productName: products[1].name, category: products[1].category, quantity: 2, sellPrice: 12000, buyPrice: 8000, totalRevenue: 24000, totalCost: 16000, profit: 8000, customerName: 'Office Pro Ltd', note: '', date: daysAgo(5) },
    { id: generateId(), productId: products[3].id, productName: products[3].name, category: products[3].category, quantity: 10, sellPrice: 7500, buyPrice: 5000, totalRevenue: 75000, totalCost: 50000, profit: 25000, customerName: 'Photo Studio', note: '', date: daysAgo(4) },
    { id: generateId(), productId: products[0].id, productName: products[0].name, category: products[0].category, quantity: 3, sellPrice: 3500, buyPrice: 2500, totalRevenue: 10500, totalCost: 7500, profit: 3000, customerName: 'Walk-in', note: '', date: daysAgo(3) },
    { id: generateId(), productId: products[4].id, productName: products[4].name, category: products[4].category, quantity: 2, sellPrice: 5500, buyPrice: 3500, totalRevenue: 11000, totalCost: 7000, profit: 4000, customerName: 'Business Center', note: '', date: daysAgo(2) },
    { id: generateId(), productId: products[5].id, productName: products[5].name, category: products[5].category, quantity: 4, sellPrice: 6500, buyPrice: 4500, totalRevenue: 26000, totalCost: 18000, profit: 8000, customerName: 'Print Shop', note: '', date: daysAgo(1) },
    { id: generateId(), productId: products[7].id, productName: products[7].name, category: products[7].category, quantity: 3, sellPrice: 3000, buyPrice: 2000, totalRevenue: 9000, totalCost: 6000, profit: 3000, customerName: 'Walk-in', note: '', date: daysAgo(0) },
  ];
  saveSales(sales);

  const purchases = [
    { id: generateId(), productId: products[0].id, productName: products[0].name, category: products[0].category, quantity: 100, buyPrice: 2500, totalCost: 250000, supplier: 'Paper World RW', note: '', date: daysAgo(28) },
    { id: generateId(), productId: products[1].id, productName: products[1].name, category: products[1].category, quantity: 20, buyPrice: 8000, totalCost: 160000, supplier: 'Tech Supplies', note: '', date: daysAgo(22) },
    { id: generateId(), productId: products[3].id, productName: products[3].name, category: products[3].category, quantity: 50, buyPrice: 5000, totalCost: 250000, supplier: 'Paper World RW', note: '', date: daysAgo(18) },
    { id: generateId(), productId: products[5].id, productName: products[5].name, category: products[5].category, quantity: 30, buyPrice: 4500, totalCost: 135000, supplier: 'Office Supplies Ltd', note: '', date: daysAgo(14) },
  ];
  savePurchases(purchases);
};
