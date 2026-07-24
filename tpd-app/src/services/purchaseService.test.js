import { describe, it, expect } from 'vitest';
import { addProduct, getAllProducts } from './productService';
import {
  getAllPurchases,
  recordPurchase,
  deletePurchase,
  getPurchaseSummary,
} from './purchaseService';

const seedProduct = (qty = 10) =>
  addProduct({
    name: 'HP Ink Cartridge',
    category: 'Toner & Cartridges',
    buyPrice: 8000,
    sellPrice: 12000,
    quantity: qty,
    minStock: 3,
  });

describe('getAllPurchases', () => {
  it('returns empty array initially', () => {
    expect(getAllPurchases()).toEqual([]);
  });
});

describe('recordPurchase', () => {
  it('creates a purchase record', () => {
    const product = seedProduct(5);
    const purchase = recordPurchase({
      productId: product.id,
      quantity: 10,
      buyPrice: 8000,
      quality: 'Grade A',
    });

    expect(purchase.id).toBeDefined();
    expect(purchase.productName).toBe('HP Ink Cartridge');
    expect(purchase.quantity).toBe(10);
    expect(purchase.totalCost).toBe(80000); // 8000 × 10
    expect(purchase.quality).toBe('Grade A');
  });

  it('increases the product stock by the purchased quantity', () => {
    const { id } = seedProduct(5);
    recordPurchase({ productId: id, quantity: 15, buyPrice: 8000 });
    const updated = getAllProducts().find((p) => p.id === id);
    expect(updated.quantity).toBe(20); // 5 + 15
  });

  it('falls back to the product buy price when no price supplied', () => {
    const product = seedProduct();
    const purchase = recordPurchase({ productId: product.id, quantity: 5 });
    expect(purchase.buyPrice).toBe(8000); // product default price
    expect(purchase.totalCost).toBe(40000);
  });

  it('throws when product id does not exist', () => {
    expect(() =>
      recordPurchase({ productId: 'ghost-id', quantity: 10, buyPrice: 1000 })
    ).toThrow('Product not found');
  });

  it('accumulates purchases correctly', () => {
    const product = seedProduct();
    recordPurchase({ productId: product.id, quantity: 5,  buyPrice: 8000 });
    recordPurchase({ productId: product.id, quantity: 10, buyPrice: 7500 });
    expect(getAllPurchases()).toHaveLength(2);
  });
});

describe('deletePurchase', () => {
  it('removes the purchase record', () => {
    const product = seedProduct();
    const p = recordPurchase({ productId: product.id, quantity: 3, buyPrice: 8000 });
    deletePurchase(p.id);
    expect(getAllPurchases()).toHaveLength(0);
  });
});

describe('getPurchaseSummary', () => {
  it('returns zeros for empty list', () => {
    const s = getPurchaseSummary([]);
    expect(s.totalSpent).toBe(0);
    expect(s.totalQty).toBe(0);
    expect(s.count).toBe(0);
  });

  it('sums totalSpent and totalQty correctly', () => {
    const fakePurchases = [
      { totalCost: 50000, quantity: 10 },
      { totalCost: 30000, quantity:  6 },
    ];
    const s = getPurchaseSummary(fakePurchases);
    expect(s.totalSpent).toBe(80000);
    expect(s.totalQty).toBe(16);
    expect(s.count).toBe(2);
  });
});
