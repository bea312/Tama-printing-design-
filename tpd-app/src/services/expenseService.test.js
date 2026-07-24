import { describe, it, expect } from 'vitest';
import {
  getAllExpenses,
  recordExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} from './expenseService';

describe('getAllExpenses', () => {
  it('returns empty array initially', () => {
    expect(getAllExpenses()).toEqual([]);
  });
});

describe('recordExpense', () => {
  it('creates an expense record with correct fields', () => {
    const expense = recordExpense({
      category: 'Rent',
      remark: 'July shop rent',
      amount: 150000,
      date: '2026-07-01',
    });

    expect(expense.id).toBeDefined();
    expect(expense.category).toBe('Rent');
    expect(expense.remark).toBe('July shop rent');
    expect(expense.amount).toBe(150000);
  });

  it('throws when category is missing', () => {
    expect(() => recordExpense({ amount: 5000 })).toThrow('Category is required');
  });

  it('throws when amount is missing or zero', () => {
    expect(() => recordExpense({ category: 'Rent', amount: 0 })).toThrow('Enter a valid amount');
    expect(() => recordExpense({ category: 'Rent' })).toThrow('Enter a valid amount');
  });

  it('appends to the expense list on each call', () => {
    recordExpense({ category: 'Electricity', amount: 20000 });
    recordExpense({ category: 'Transport', amount: 10000 });
    expect(getAllExpenses()).toHaveLength(2);
  });
});

describe('updateExpense', () => {
  it('updates an existing expense', () => {
    const expense = recordExpense({ category: 'Salaries', amount: 300000, remark: 'June payroll' });
    const updated = updateExpense(expense.id, { category: 'Salaries', amount: 320000, remark: 'June payroll (revised)' });
    expect(updated.amount).toBe(320000);
    expect(updated.remark).toBe('June payroll (revised)');
    expect(getAllExpenses()).toHaveLength(1);
  });

  it('throws when the expense id does not exist', () => {
    expect(() => updateExpense('ghost-id', { category: 'Rent', amount: 1000 })).toThrow('Expense not found');
  });
});

describe('deleteExpense', () => {
  it('removes the expense record', () => {
    const expense = recordExpense({ category: 'Water', amount: 8000 });
    expect(getAllExpenses()).toHaveLength(1);
    deleteExpense(expense.id);
    expect(getAllExpenses()).toHaveLength(0);
  });
});

describe('getExpenseSummary', () => {
  it('returns zeros for an empty list', () => {
    const summary = getExpenseSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.count).toBe(0);
  });

  it('sums total and counts correctly', () => {
    const fakeExpenses = [{ amount: 150000 }, { amount: 20000 }, { amount: 10000 }];
    const summary = getExpenseSummary(fakeExpenses);
    expect(summary.total).toBe(180000);
    expect(summary.count).toBe(3);
  });
});
