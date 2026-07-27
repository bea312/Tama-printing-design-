import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import { addEmployee } from '../services/teamService';

// A small helper component that exercises the auth context
function AuthTestUI() {
  const { user, login, logout, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!user)   return (
    <>
      <p>Not logged in</p>
      <button onClick={() => login('admin@tpd.com', 'tpd2024')}>Login OK</button>
      <button onClick={() => login('admin@tpd.com', 'wrongpass')}>Login BAD</button>
    </>
  );
  return (
    <>
      <p>Logged in as: {user.name}</p>
      <p>Role: {user.role}</p>
      <button onClick={logout}>Logout</button>
    </>
  );
}

// A login form for an arbitrary email/password, used to test employee logins
function LoginAsUI({ email, password }) {
  const { user, login } = useAuth();
  if (!user) return <button onClick={() => login(email, password)}>Employee Login</button>;
  return <p>Employee session: {user.name} ({user.role})</p>;
}

const renderAuth = () =>
  render(
    <AuthProvider>
      <AuthTestUI />
    </AuthProvider>
  );

describe('AuthContext', () => {
  it('starts in loading state then shows "Not logged in"', async () => {
    renderAuth();
    // After loading resolves, show unauthenticated state
    expect(await screen.findByText('Not logged in')).toBeInTheDocument();
  });

  it('creates an account automatically on first login with a new email', async () => {
    renderAuth();
    await screen.findByText('Not logged in');
    await userEvent.click(screen.getByText('Login OK'));
    expect(await screen.findByText(/Logged in as:/)).toBeInTheDocument();
    expect(screen.getByText(/Admin/)).toBeInTheDocument();
    expect(screen.getByText(/Role: admin/)).toBeInTheDocument();
  });

  it('rejects wrong password on an email that already has an account', async () => {
    // First login creates the account with the "correct" password
    renderAuth();
    await screen.findByText('Not logged in');
    await userEvent.click(screen.getByText('Login OK'));
    await screen.findByText(/Logged in as:/);

    // Log out, then try the same email with the wrong password
    await userEvent.click(screen.getByText('Logout'));
    await screen.findByText('Not logged in');
    await userEvent.click(screen.getByText('Login BAD'));
    // Should still show not-logged-in
    expect(screen.getByText('Not logged in')).toBeInTheDocument();
  });

  it('persists login to localStorage', async () => {
    renderAuth();
    await screen.findByText('Not logged in');
    await userEvent.click(screen.getByText('Login OK'));
    await screen.findByText(/Logged in as:/);
    const stored = JSON.parse(localStorage.getItem('tpd_auth'));
    expect(stored).not.toBeNull();
    expect(stored.role).toBe('admin');
    expect(stored.email).toBe('admin@tpd.com');
  });

  it('logs out and clears state and localStorage', async () => {
    renderAuth();
    await screen.findByText('Not logged in');
    await userEvent.click(screen.getByText('Login OK'));
    await screen.findByText('Logout');
    await userEvent.click(screen.getByText('Logout'));
    expect(await screen.findByText('Not logged in')).toBeInTheDocument();
    expect(localStorage.getItem('tpd_auth')).toBeNull();
  });

  it('restores session from localStorage on mount', async () => {
    // Pre-populate localStorage with a saved session
    localStorage.setItem('tpd_auth', JSON.stringify({ email: 'admin@tpd.com', name: 'Admin', role: 'admin', loginAt: new Date().toISOString() }));
    renderAuth();
    expect(await screen.findByText(/Logged in as:/)).toBeInTheDocument();
  });

  it('logging back in with the same email returns to the same account (not a fresh one)', async () => {
    renderAuth();
    await screen.findByText('Not logged in');
    await userEvent.click(screen.getByText('Login OK'));
    await screen.findByText(/Logged in as:/);
    await userEvent.click(screen.getByText('Logout'));
    await screen.findByText('Not logged in');

    // Second login with the same email — should reuse the account, not create a new one
    await userEvent.click(screen.getByText('Login OK'));
    await screen.findByText(/Logged in as:/);
    const users = JSON.parse(localStorage.getItem('tpd_users'));
    expect(users).toHaveLength(1);
  });

  it('logs in as an employee created by an admin, with role "employee"', async () => {
    // Create the admin account and log it out (employees are created out-of-band by the admin)
    renderAuth();
    await screen.findByText('Not logged in');
    await userEvent.click(screen.getByText('Login OK'));
    await screen.findByText(/Logged in as:/);
    await userEvent.click(screen.getByText('Logout'));
    await screen.findByText('Not logged in');

    addEmployee('admin@tpd.com', { email: 'staff@tpd.com', password: 'staffpass', name: 'Staff One' });

    const { getByText, findByText } = render(
      <AuthProvider>
        <LoginAsUI email="staff@tpd.com" password="staffpass" />
      </AuthProvider>
    );
    await userEvent.click(getByText('Employee Login'));
    expect(await findByText('Employee session: Staff One (employee)')).toBeInTheDocument();
  });

  it('rejects an employee login with the wrong password', async () => {
    renderAuth();
    await screen.findByText('Not logged in');
    await userEvent.click(screen.getByText('Login OK'));
    await screen.findByText(/Logged in as:/);
    await userEvent.click(screen.getByText('Logout'));
    await screen.findByText('Not logged in');

    addEmployee('admin@tpd.com', { email: 'staff2@tpd.com', password: 'correctpass', name: 'Staff Two' });

    const { getByText, queryByText } = render(
      <AuthProvider>
        <LoginAsUI email="staff2@tpd.com" password="wrongpass" />
      </AuthProvider>
    );
    await userEvent.click(getByText('Employee Login'));
    expect(queryByText(/Employee session:/)).not.toBeInTheDocument();
  });
});
