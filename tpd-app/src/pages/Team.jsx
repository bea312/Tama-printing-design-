import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Users, Eye, EyeOff } from 'lucide-react';
import Header from '../components/common/Header';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { getMyEmployees, addEmployee, removeEmployee } from '../services/teamService';
import { formatDate } from '../utils/helpers';

const EMPTY = { name: '', email: '', password: '' };

export default function Team() {
  const { user } = useAuth();
  const { addToast } = useApp();
  const { t } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setEmployees(await getMyEmployees(user.email));
  }, [user.email]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(getMyEmployees(user.email)).then((list) => { if (!cancelled) setEmployees(list); });
    return () => { cancelled = true; };
  }, [user.email]);

  const openAdd = () => { setForm(EMPTY); setErrors({}); setShowPass(false); setModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await addEmployee(user.email, form);
      await refresh();
      addToast(t('team.employeeAdded'), 'success');
      setModal(false);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await removeEmployee(id);
    await refresh();
    addToast(t('team.employeeRemoved'), 'info');
  };

  return (
    <div>
      <Header title={t('team.title')} subtitle={t('team.subtitle')} />
      <div className="page-wrapper">
        <div className="toolbar">
          <div className="toolbar-left">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {employees.length} {t('team.membersCount')}
            </span>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> {t('team.addEmployee')}
          </button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('team.name')}</th>
                  <th>{t('login.email')}</th>
                  <th>{t('common.date')}</th>
                  <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan={4}>
                    <div className="empty-state"><Users size={40} /><h3>{t('team.noEmployeesYet')}</h3><p>{t('team.addFirstEmployee')}</p></div>
                  </td></tr>
                ) : employees.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.email}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(e.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmId(e.id)} title={t('common.delete')} style={{ color: 'var(--accent-red-light)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={t('team.addEmployee')}>
        {errors.form && (
          <div className="alert alert-danger">{errors.form}</div>
        )}
        <div className="form-group">
          <label className="form-label">{t('team.name')}</label>
          <input className="form-input" placeholder="e.g. Jean Baptiste" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('login.email')}</label>
          <input className="form-input" type="email" placeholder="employee@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('login.password')}</label>
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              style={{ paddingRight: '42px' }}
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setModal(false)}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{t('team.addEmployee')}</button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => handleDelete(confirmId)}
        title={t('team.removeEmployeeTitle')}
        message={t('team.removeEmployeeMessage')}
      />
    </div>
  );
}
