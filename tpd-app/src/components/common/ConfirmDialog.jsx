import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel, danger = true }) {
  const { t } = useLanguage();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || t('common.confirmAction')} maxWidth="420px">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: danger ? 'var(--accent-red-light)' : 'var(--accent-gold-light)',
        }}>
          <AlertTriangle size={24} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {message || t('common.areYouSure')}
        </p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-warning'}`} onClick={() => { onConfirm(); onClose(); }}>
          {confirmLabel || t('common.delete')}
        </button>
      </div>
    </Modal>
  );
}
