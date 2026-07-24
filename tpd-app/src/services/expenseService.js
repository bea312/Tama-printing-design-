import { getExpenses, saveExpenses } from './storage';
import { generateId } from '../utils/helpers';

export const getAllExpenses = () => getExpenses();

export const recordExpense = (data) => {
  if (!data.category) throw new Error('Category is required');
  if (!data.amount || Number(data.amount) <= 0) throw new Error('Enter a valid amount');

  const expense = {
    id: generateId(),
    category: data.category,
    remark: data.remark || '',
    amount: Number(data.amount),
    date: data.date || new Date().toISOString(),
  };

  const expenses = getExpenses();
  expenses.push(expense);
  saveExpenses(expenses);
  return expense;
};

export const updateExpense = (id, data) => {
  const expenses = getExpenses();
  const idx = expenses.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Expense not found');

  expenses[idx] = {
    ...expenses[idx],
    category: data.category,
    remark: data.remark || '',
    amount: Number(data.amount),
    date: data.date || expenses[idx].date,
  };
  saveExpenses(expenses);
  return expenses[idx];
};

export const deleteExpense = (id) => {
  const expenses = getExpenses().filter((e) => e.id !== id);
  saveExpenses(expenses);
};

export const getExpenseSummary = (expenses = getExpenses()) => {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  return { total, count: expenses.length };
};
