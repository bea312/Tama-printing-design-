import { doc, setDoc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { getEmployees, saveEmployees, getUsers } from './storage';
import { generateId } from '../utils/helpers';
import { db, firebaseEnabled } from './firebase';
import { createEmployeeAuthAccount } from './firebaseAdmin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Cloud mode: employees are real Firebase Auth users (see firebaseAdmin.js), with their
   role/name/owner kept in a Firestore doc so the login flow in AuthContext can tell them
   apart from admins. Returns a Promise — callers await it. */
const addEmployeeCloud = async (ownerEmail, normalizedEmail, password, name) => {
  try {
    await createEmployeeAuthAccount(normalizedEmail, password);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('An employee with this email already exists, or it already belongs to an admin account', { cause: err });
    }
    if (err.code === 'auth/weak-password') {
      throw new Error('Password must be at least 6 characters', { cause: err });
    }
    throw new Error('Could not create the employee account', { cause: err });
  }

  const employee = {
    email: normalizedEmail,
    name: name?.trim() || normalizedEmail.split('@')[0],
    ownerEmail,
    role: 'employee',
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'employees', normalizedEmail), employee);
  return { id: normalizedEmail, ...employee };
};

/* Local-only mode: returns synchronously, and throws synchronously on validation
   failure — same behavior as before Firestore existed. */
export const addEmployee = (ownerEmail, { email, password, name }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!EMAIL_RE.test(normalizedEmail)) throw new Error('Enter a valid email address');
  if (!password || password.length < 4) throw new Error('Password must be at least 4 characters');

  if (firebaseEnabled) {
    return addEmployeeCloud(ownerEmail, normalizedEmail, password, name);
  }

  const employees = getEmployees();
  if (employees.some((e) => e.email === normalizedEmail)) {
    throw new Error('An employee with this email already exists');
  }
  if (getUsers().some((u) => u.email === normalizedEmail)) {
    throw new Error('This email already belongs to an admin account');
  }

  const employee = {
    id: generateId(),
    email: normalizedEmail,
    password,
    name: name?.trim() || normalizedEmail.split('@')[0],
    ownerEmail,
    role: 'employee',
    createdAt: new Date().toISOString(),
  };
  saveEmployees([...employees, employee]);
  return employee;
};

/* Cloud mode returns a Promise resolving to the array; local mode returns the array
   directly. Callers should `await` the result either way. */
export const getMyEmployees = (ownerEmail) => {
  if (firebaseEnabled) {
    return getDocs(query(collection(db, 'employees'), where('ownerEmail', '==', ownerEmail)))
      .then((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }
  return getEmployees().filter((e) => e.ownerEmail === ownerEmail);
};

export const removeEmployee = (id) => {
  if (firebaseEnabled) {
    // id is the employee's email (the Firestore doc id) in cloud mode.
    // Note: this removes their access record but cannot delete their Firebase Auth
    // account from the client SDK — they could still sign in, just as a brand-new
    // admin with an empty namespace of their own, since no employee doc matches them.
    return deleteDoc(doc(db, 'employees', id));
  }
  saveEmployees(getEmployees().filter((e) => e.id !== id));
};
