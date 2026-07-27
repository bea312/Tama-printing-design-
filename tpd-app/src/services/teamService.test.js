import { describe, it, expect } from 'vitest';
import { addEmployee, getMyEmployees, removeEmployee } from './teamService';

describe('addEmployee', () => {
  it('creates an employee tied to the owner admin', () => {
    const employee = addEmployee('owner@tpd.com', { email: 'staff@tpd.com', password: 'staffpass', name: 'Staff One' });
    expect(employee.id).toBeDefined();
    expect(employee.email).toBe('staff@tpd.com');
    expect(employee.ownerEmail).toBe('owner@tpd.com');
    expect(employee.role).toBe('employee');
  });

  it('defaults the name from the email when none is given', () => {
    const employee = addEmployee('owner@tpd.com', { email: 'noname@tpd.com', password: 'testpass' });
    expect(employee.name).toBe('noname');
  });

  it('throws on an invalid email', () => {
    expect(() => addEmployee('owner@tpd.com', { email: 'not-an-email', password: 'testpass' })).toThrow('Enter a valid email address');
  });

  it('throws on a weak password', () => {
    expect(() => addEmployee('owner@tpd.com', { email: 'staff3@tpd.com', password: '123' })).toThrow('Password must be at least 4 characters');
  });

  it('throws when the email is already an employee elsewhere', () => {
    addEmployee('owner@tpd.com', { email: 'dupe@tpd.com', password: 'testpass' });
    expect(() => addEmployee('other-owner@tpd.com', { email: 'dupe@tpd.com', password: 'testpass' }))
      .toThrow('An employee with this email already exists');
  });
});

describe('getMyEmployees', () => {
  it('only returns employees belonging to the given owner', () => {
    addEmployee('ownerA@tpd.com', { email: 'a1@tpd.com', password: 'testpass' });
    addEmployee('ownerA@tpd.com', { email: 'a2@tpd.com', password: 'testpass' });
    addEmployee('ownerB@tpd.com', { email: 'b1@tpd.com', password: 'testpass' });

    expect(getMyEmployees('ownerA@tpd.com')).toHaveLength(2);
    expect(getMyEmployees('ownerB@tpd.com')).toHaveLength(1);
    expect(getMyEmployees('ownerC@tpd.com')).toHaveLength(0);
  });
});

describe('removeEmployee', () => {
  it('removes the employee record', () => {
    const employee = addEmployee('owner@tpd.com', { email: 'temp@tpd.com', password: 'testpass' });
    expect(getMyEmployees('owner@tpd.com')).toHaveLength(1);
    removeEmployee(employee.id);
    expect(getMyEmployees('owner@tpd.com')).toHaveLength(0);
  });
});
