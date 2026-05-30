import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('TPD App Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: '40px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--accent-red-light)',
            }}>
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px', lineHeight: 1.6 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              style={{ margin: '0 auto' }}
            >
              <RefreshCw size={15} /> Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
