import { Component } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    console.error('Uncaught error caught by ErrorBoundary:', error, info);
  }

  handleReload = () => {
    sessionStorage.removeItem('fixiva_chunk_reload_attempted');
    window.location.reload();
  };

  handleGoHome = () => {
    sessionStorage.removeItem('fixiva_chunk_reload_attempted');
    window.location.href = '/';
  };

  render() {
    const { error, showDetails } = this.state;
    if (error) {
      const errorMsg = error?.message || String(error);
      const isChunkError =
        errorMsg.includes('Failed to fetch dynamically imported module') ||
        errorMsg.includes('Loading chunk') ||
        errorMsg.includes('Importing a module script failed');

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '1.5rem'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E2E8F0',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: isChunkError ? '#FEF3C7' : '#FEE2E2',
              color: isChunkError ? '#D97706' : '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              {isChunkError ? <RefreshCw size={28} /> : <AlertTriangle size={28} />}
            </div>

            <h2 style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: '0.5rem',
              lineHeight: 1.3
            }}>
              {isChunkError ? 'New Version Available' : 'Something Went Wrong'}
            </h2>

            <p style={{
              fontSize: '0.9375rem',
              color: '#475569',
              marginBottom: '1.5rem',
              lineHeight: 1.5
            }}>
              {isChunkError
                ? 'Fixiva was updated while you were browsing. Please refresh the page to load the latest components.'
                : 'An unexpected error occurred while loading this page. Please try refreshing or returning home.'}
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
              >
                <RefreshCw size={16} />
                Refresh Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E2E8F0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
              >
                <Home size={16} />
                Go to Home
              </button>
            </div>

            <div style={{ marginTop: '1.75rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
              <button
                onClick={() => this.setState({ showDetails: !showDetails })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {showDetails ? 'Hide technical details' : 'Show technical details'}
              </button>

              {showDetails && (
                <div style={{
                  marginTop: '0.75rem',
                  textAlign: 'left',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  maxHeight: '160px',
                  overflowY: 'auto'
                }}>
                  <pre style={{
                    fontSize: '0.75rem',
                    color: '#991B1B',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    fontFamily: 'monospace'
                  }}>
                    {String(error?.stack || error)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
