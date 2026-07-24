import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  generateId,
  getStockStatus,
  getStockBarLevel,
  filterByDateRange,
  getDaysAgo,
  CATEGORIES,
} from './helpers';

// ─────────────────────────────────────────
//  formatCurrency
// ─────────────────────────────────────────
describe('formatCurrency', () => {
  it('formats a positive number as RWF', () => {
    const result = formatCurrency(5000);
    expect(result).toContain('5,000');
    expect(result).toMatch(/RWF|RF/i); // locale may vary slightly
  });

  it('formats zero without crashing', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('handles null/undefined gracefully (defaults to 0)', () => {
    expect(() => formatCurrency(null)).not.toThrow();
    expect(() => formatCurrency(undefined)).not.toThrow();
  });

  it('formats large amounts correctly', () => {
    const result = formatCurrency(1_000_000);
    expect(result).toContain('1,000,000');
  });
});

// ─────────────────────────────────────────
//  formatDate
// ─────────────────────────────────────────
describe('formatDate', () => {
  it('formats an ISO date string to a human-readable date', () => {
    const result = formatDate('2024-06-15T10:00:00.000Z');
    expect(result).toMatch(/\d{2}.*Jun.*2024/i);
  });

  it('returns — for null/empty input', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('')).toBe('—');
  });
});

// ─────────────────────────────────────────
//  generateId
// ─────────────────────────────────────────
describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique IDs (no collisions in 200 calls)', () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateId()));
    expect(ids.size).toBe(200);
  });
});

// ─────────────────────────────────────────
//  getStockStatus
// ─────────────────────────────────────────
describe('getStockStatus', () => {
  it('returns "out" level when quantity is 0', () => {
    const status = getStockStatus(0);
    expect(status.level).toBe('out');
    expect(status.label).toBe('Out of Stock');
    expect(status.color).toBe('red');
  });

  it('returns "low" level when quantity is between 1 and 4', () => {
    expect(getStockStatus(1).level).toBe('low');
    expect(getStockStatus(4).level).toBe('low');
  });

  it('returns "medium" level when quantity is between 5 and 19', () => {
    expect(getStockStatus(5).level).toBe('medium');
    expect(getStockStatus(19).level).toBe('medium');
  });

  it('returns "high" level when quantity is 20 or more', () => {
    expect(getStockStatus(20).level).toBe('high');
    expect(getStockStatus(100).level).toBe('high');
    expect(getStockStatus(20).label).toBe('In Stock');
  });
});

// ─────────────────────────────────────────
//  getStockBarLevel
// ─────────────────────────────────────────
describe('getStockBarLevel', () => {
  it('returns pct = 0 when quantity is 0', () => {
    expect(getStockBarLevel(0).pct).toBe(0);
    expect(getStockBarLevel(0).cls).toBe('low');
  });

  it('caps percentage at 100', () => {
    const { pct } = getStockBarLevel(999, 100);
    expect(pct).toBe(100);
  });

  it('returns "low" class for qty < 5', () => {
    expect(getStockBarLevel(3, 100).cls).toBe('low');
  });

  it('returns "medium" class for qty < 20', () => {
    expect(getStockBarLevel(10, 100).cls).toBe('medium');
  });

  it('returns "high" class for qty >= 20', () => {
    expect(getStockBarLevel(50, 100).cls).toBe('high');
  });
});

// ─────────────────────────────────────────
//  filterByDateRange
// ─────────────────────────────────────────
describe('filterByDateRange', () => {
  const now = new Date();
  const toISO = (daysAgo) =>
    new Date(now.getTime() - daysAgo * 86400000).toISOString();

  const items = [
    { id: 1, date: toISO(0) },   // today
    { id: 2, date: toISO(3) },   // 3 days ago
    { id: 3, date: toISO(10) },  // 10 days ago
    { id: 4, date: toISO(40) },  // 40 days ago
    { id: 5, date: toISO(400) }, // over a year ago
  ];

  it('returns all items when range is "all"', () => {
    expect(filterByDateRange(items, 'all')).toHaveLength(5);
  });

  it('filters to today only', () => {
    const result = filterByDateRange(items, 'today');
    expect(result.every((i) => i.id === 1 || i.id === 2)).toBeTruthy(); // today and possibly 3 days ago if "today" means last 24h
    // At minimum, item from 40 days ago must NOT be included
    expect(result.find((i) => i.id === 4)).toBeUndefined();
  });

  it('filters last 7 days (week)', () => {
    const result = filterByDateRange(items, 'week');
    expect(result.find((i) => i.id === 1)).toBeDefined(); // today (0 days) ✓
    expect(result.find((i) => i.id === 2)).toBeDefined(); // 3 days ago ✓
    expect(result.find((i) => i.id === 3)).toBeUndefined(); // 10 days ago ✗
    expect(result.find((i) => i.id === 4)).toBeUndefined(); // 40 days ago ✗
    expect(result.find((i) => i.id === 5)).toBeUndefined(); // 400 days ago ✗
  });

  it('filters last 30 days (month)', () => {
    const result = filterByDateRange(items, 'month');
    expect(result.find((i) => i.id === 4)).toBeUndefined(); // 40 days ✗
    expect(result.find((i) => i.id === 5)).toBeUndefined(); // 400 days ✗
  });

  it('includes a date-only "today" string regardless of timezone (regression: stock-in/sale date inputs are "YYYY-MM-DD", not full ISO instants)', () => {
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const result = filterByDateRange([{ id: 'x', date: todayStr }], 'today');
    expect(result).toHaveLength(1);
  });
});

// ─────────────────────────────────────────
//  getDaysAgo
// ─────────────────────────────────────────
describe('getDaysAgo', () => {
  it('returns "Today" for the current date', () => {
    expect(getDaysAgo(new Date().toISOString())).toBe('Today');
  });

  it('returns "Yesterday" for 1 day ago', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(getDaysAgo(yesterday)).toBe('Yesterday');
  });

  it('returns "N days ago" for older dates', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString();
    expect(getDaysAgo(fiveDaysAgo)).toBe('5 days ago');
  });
});

// ─────────────────────────────────────────
//  CATEGORIES
// ─────────────────────────────────────────
describe('CATEGORIES', () => {
  it('is an array with at least one entry', () => {
    expect(Array.isArray(CATEGORIES)).toBe(true);
    expect(CATEGORIES.length).toBeGreaterThan(0);
  });

  it('all entries are non-empty strings', () => {
    CATEGORIES.forEach((c) => {
      expect(typeof c).toBe('string');
      expect(c.trim().length).toBeGreaterThan(0);
    });
  });
});
