import { describe, it, expect } from 'vitest';
import {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  incrementStock,
  decrementStock,
  getLowStockProducts,
} from './productService';

// Seed a reusable product helper
const makeProduct = (overrides = {}) => ({
  name:      'Test Paper A4',
  category:  'Paper & Cardstock',
  buyPrice:  2500,
  sellPrice: 3500,
  quantity:  20,
  minStock:  5,
  ...overrides,
});

// localStorage is cleared by setup.js before each test

describe('getAllProducts', () => {
  it('returns an empty array when no products exist', () => {
    expect(getAllProducts()).toEqual([]);
  });
});

describe('addProduct', () => {
  it('creates a product and stores it', () => {
    const product = addProduct(makeProduct());
    expect(product.id).toBeDefined();
    expect(product.name).toBe('Test Paper A4');
    expect(getAllProducts()).toHaveLength(1);
  });

  it('assigns numeric prices', () => {
    const product = addProduct(makeProduct({ buyPrice: '1000', sellPrice: '2000' }));
    expect(typeof product.buyPrice).toBe('number');
    expect(product.buyPrice).toBe(1000);
  });

  it('stores createdAt timestamp', () => {
    const product = addProduct(makeProduct());
    expect(product.createdAt).toBeDefined();
    expect(new Date(product.createdAt).getTime()).not.toBeNaN();
  });

  it('can add multiple products', () => {
    addProduct(makeProduct({ name: 'Pen A' }));
    addProduct(makeProduct({ name: 'Pen B' }));
    addProduct(makeProduct({ name: 'Pen C' }));
    expect(getAllProducts()).toHaveLength(3);
  });
});

describe('updateProduct', () => {
  it('updates name and prices', () => {
    const { id } = addProduct(makeProduct());
    const updated = updateProduct(id, { name: 'Updated Name', category: 'Stationery', buyPrice: 3000, sellPrice: 5000, minStock: 10 });
    expect(updated.name).toBe('Updated Name');
    expect(updated.buyPrice).toBe(3000);
    expect(updated.sellPrice).toBe(5000);
  });

  it('does NOT change quantity when editing', () => {
    const { id } = addProduct(makeProduct({ quantity: 50 }));
    updateProduct(id, { name: 'X', category: 'Stationery', buyPrice: 1000, sellPrice: 2000, minStock: 5 });
    const products = getAllProducts();
    expect(products[0].quantity).toBe(50); // unchanged
  });

  it('returns null for a non-existent id', () => {
    const result = updateProduct('fake-id-999', makeProduct());
    expect(result).toBeNull();
  });
});

describe('deleteProduct', () => {
  it('removes the product from storage', () => {
    const { id } = addProduct(makeProduct());
    expect(getAllProducts()).toHaveLength(1);
    deleteProduct(id);
    expect(getAllProducts()).toHaveLength(0);
  });

  it('only removes the targeted product', () => {
    const p1 = addProduct(makeProduct({ name: 'Keep Me' }));
    const p2 = addProduct(makeProduct({ name: 'Delete Me' }));
    deleteProduct(p2.id);
    const remaining = getAllProducts();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(p1.id);
  });
});

describe('incrementStock', () => {
  it('increases product quantity by the given amount', () => {
    const { id } = addProduct(makeProduct({ quantity: 10 }));
    incrementStock(id, 5);
    const product = getAllProducts().find((p) => p.id === id);
    expect(product.quantity).toBe(15);
  });

  it('returns false for a non-existent id', () => {
    expect(incrementStock('bad-id', 5)).toBe(false);
  });
});

describe('decrementStock', () => {
  it('decreases product quantity by the given amount', () => {
    const { id } = addProduct(makeProduct({ quantity: 20 }));
    decrementStock(id, 7);
    const product = getAllProducts().find((p) => p.id === id);
    expect(product.quantity).toBe(13);
  });

  it('returns false when quantity would go negative', () => {
    const { id } = addProduct(makeProduct({ quantity: 5 }));
    const result = decrementStock(id, 10);
    expect(result).toBe(false);
    // quantity must remain unchanged
    const product = getAllProducts().find((p) => p.id === id);
    expect(product.quantity).toBe(5);
  });

  it('allows decrement to exactly 0', () => {
    const { id } = addProduct(makeProduct({ quantity: 5 }));
    const result = decrementStock(id, 5);
    expect(result).toBe(true);
    expect(getAllProducts().find((p) => p.id === id).quantity).toBe(0);
  });
});

describe('getLowStockProducts', () => {
  it('returns products at or below their minStock level', () => {
    addProduct(makeProduct({ name: 'Plenty', quantity: 50, minStock: 5 }));
    addProduct(makeProduct({ name: 'Low',    quantity: 3,  minStock: 5 }));
    addProduct(makeProduct({ name: 'Empty',  quantity: 0,  minStock: 5 }));

    const low = getLowStockProducts();
    expect(low).toHaveLength(2);
    expect(low.map((p) => p.name)).toContain('Low');
    expect(low.map((p) => p.name)).toContain('Empty');
  });

  it('returns empty array when all products are well-stocked', () => {
    addProduct(makeProduct({ quantity: 100, minStock: 10 }));
    expect(getLowStockProducts()).toHaveLength(0);
  });
});
