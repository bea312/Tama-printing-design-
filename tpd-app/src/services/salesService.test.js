import { describe, it, expect } from 'vitest';
import { addProduct, getAllProducts } from './productService';
import {
  getAllSales,
  recordSale,
  deleteSale,
  getSalesSummary,
  getSalePayment,
} from './salesService';

// Utility: create a stocked product and return it
const seedProduct = (overrides = {}) =>
  addProduct({
    name: 'A4 Paper',
    category: 'Paper & Cardstock',
    buyPrice: 2000,
    sellPrice: 3000,
    quantity: 50,
    minStock: 5,
    ...overrides,
  });

describe('getAllSales', () => {
  it('returns empty array initially', () => {
    expect(getAllSales()).toEqual([]);
  });
});

describe('recordSale', () => {
  it('creates a sale record with correct fields', () => {
    const product = seedProduct();
    const sale = recordSale({
      productId: product.id,
      quantity: 5,
      quality: 'Grade A',
      momoAmount: 15000,
      date: new Date().toISOString(),
    });

    expect(sale.id).toBeDefined();
    expect(sale.productName).toBe('A4 Paper');
    expect(sale.quantity).toBe(5);
    expect(sale.sellPrice).toBe(3000);
    expect(sale.buyPrice).toBe(2000);
    expect(sale.quality).toBe('Grade A');
    expect(sale.paymentMethod).toBe('momo');
  });

  it('defaults payment method to cash when not specified', () => {
    const product = seedProduct();
    const sale = recordSale({ productId: product.id, quantity: 1 });
    expect(sale.paymentMethod).toBe('cash');
  });

  it('defaults amountPaid to the full total revenue when not specified', () => {
    const product = seedProduct({ sellPrice: 3000 });
    const sale = recordSale({ productId: product.id, quantity: 4 });
    expect(sale.amountPaid).toBe(12000); // fully paid by default
    expect(sale.totalRevenue).toBe(12000);
  });

  it('records a partial payment when amountPaid is less than the total', () => {
    const product = seedProduct({ sellPrice: 3000 });
    const sale = recordSale({ productId: product.id, quantity: 4, cashAmount: 5000 });
    expect(sale.amountPaid).toBe(5000);
    expect(sale.totalRevenue - sale.amountPaid).toBe(7000); // still owes 7000
  });

  it('splits a payment across cash and momo', () => {
    const product = seedProduct({ sellPrice: 3000 });
    const sale = recordSale({ productId: product.id, quantity: 4, cashAmount: 7000, momoAmount: 5000 });
    expect(sale.cashAmount).toBe(7000);
    expect(sale.momoAmount).toBe(5000);
    expect(sale.amountPaid).toBe(12000);
    expect(sale.paymentMethod).toBe('split');
  });

  it('calculates revenue, cost, and profit correctly', () => {
    const product = seedProduct({ buyPrice: 2000, sellPrice: 3000 });
    const sale = recordSale({ productId: product.id, quantity: 4 });

    expect(sale.totalRevenue).toBe(12000); // 3000 × 4
    expect(sale.totalCost).toBe(8000);     // 2000 × 4
    expect(sale.profit).toBe(4000);        // 1000 × 4
  });

  it('reduces product stock by the sold quantity', () => {
    const { id } = seedProduct({ quantity: 20 });
    recordSale({ productId: id, quantity: 7 });
    const updated = getAllProducts().find((p) => p.id === id);
    expect(updated.quantity).toBe(13);
  });

  it('throws an error when quantity exceeds available stock', () => {
    const product = seedProduct({ quantity: 3 });
    expect(() =>
      recordSale({ productId: product.id, quantity: 10 })
    ).toThrow();
  });

  it('throws when selling an out-of-stock product', () => {
    const product = seedProduct({ quantity: 0 });
    expect(() =>
      recordSale({ productId: product.id, quantity: 1 })
    ).toThrow();
  });

  it('throws when product id does not exist', () => {
    expect(() =>
      recordSale({ productId: 'non-existent-id', quantity: 1 })
    ).toThrow('Product not found');
  });

  it('appends to sales list on each call', () => {
    const product = seedProduct({ quantity: 100 });
    recordSale({ productId: product.id, quantity: 1 });
    recordSale({ productId: product.id, quantity: 2 });
    recordSale({ productId: product.id, quantity: 3 });
    expect(getAllSales()).toHaveLength(3);
  });
});

describe('getSalePayment', () => {
  it('reads the split cash/momo amounts directly off a new-style sale', () => {
    const sale = { totalRevenue: 10000, amountPaid: 10000, cashAmount: 6000, momoAmount: 4000, paymentMethod: 'split' };
    expect(getSalePayment(sale)).toEqual({ cashAmount: 6000, momoAmount: 4000, paid: 10000, balance: 0 });
  });

  it('derives an all-cash breakdown for old-style records with no cashAmount/momoAmount', () => {
    const sale = { totalRevenue: 5000, amountPaid: 5000, paymentMethod: 'cash' };
    expect(getSalePayment(sale)).toEqual({ cashAmount: 5000, momoAmount: 0, paid: 5000, balance: 0 });
  });

  it('derives an all-momo breakdown for old-style momo records', () => {
    const sale = { totalRevenue: 5000, amountPaid: 3000, paymentMethod: 'momo' };
    expect(getSalePayment(sale)).toEqual({ cashAmount: 0, momoAmount: 3000, paid: 3000, balance: 2000 });
  });
});

describe('deleteSale', () => {
  it('removes the sale from storage', () => {
    const product = seedProduct();
    const sale = recordSale({ productId: product.id, quantity: 1 });
    expect(getAllSales()).toHaveLength(1);
    deleteSale(sale.id);
    expect(getAllSales()).toHaveLength(0);
  });

  it('does not affect other sales', () => {
    const product = seedProduct({ quantity: 50 });
    const s1 = recordSale({ productId: product.id, quantity: 1 });
    const s2 = recordSale({ productId: product.id, quantity: 2 });
    deleteSale(s1.id);
    const remaining = getAllSales();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(s2.id);
  });
});

describe('getSalesSummary', () => {
  it('returns zeros for an empty list', () => {
    const summary = getSalesSummary([]);
    expect(summary.totalRevenue).toBe(0);
    expect(summary.totalCost).toBe(0);
    expect(summary.totalProfit).toBe(0);
    expect(summary.count).toBe(0);
  });

  it('sums revenue, cost, and profit correctly', () => {
    const fakeSales = [
      { totalRevenue: 5000, totalCost: 3000, profit: 2000, quantity: 2 },
      { totalRevenue: 3000, totalCost: 2000, profit: 1000, quantity: 1 },
    ];
    const summary = getSalesSummary(fakeSales);
    expect(summary.totalRevenue).toBe(8000);
    expect(summary.totalCost).toBe(5000);
    expect(summary.totalProfit).toBe(3000);
    expect(summary.totalQty).toBe(3);
    expect(summary.count).toBe(2);
  });
});
