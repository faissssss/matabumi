import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import App from './App';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error">
          <h2>⚠️ Application Error</h2>
          <p>MataBumi encountered an unexpected error.</p>
          <details style={{ marginTop: '1rem', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', color: '#f59e0b' }}>
              Error Details
            </summary>
            <pre style={{ 
              marginTop: '0.5rem', 
              padding: '1rem', 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) {
  document.body.innerHTML = `
    <div class="app-error">
      <h2>⚠️ Critical Error</h2>
      <p>Root element not found. The application cannot start.</p>
      <button onclick="window.location.reload()">Reload Page</button>
    </div>
  `;
  throw new Error('Root element not found');
}

// Theme is already set by inline script in index.html
// Just verify it's set correctly
try {
  const theme = localStorage.getItem('matabumi-theme') || 'dark';
  if (!document.documentElement.classList.contains(theme)) {
    document.documentElement.classList.add(theme);
  }
} catch (e) {
  console.warn('Could not verify theme:', e);
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
