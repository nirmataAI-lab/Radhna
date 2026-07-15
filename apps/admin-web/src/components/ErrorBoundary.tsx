import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-background)]">
        <div className="premium-card p-8 max-w-md w-full text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-1">
            The admin panel hit an unexpected error.
          </p>
          <pre className="text-xs text-left bg-[var(--color-muted)] p-3 rounded-lg my-4 overflow-auto max-h-40">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => { this.reset(); location.reload(); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCcw className="w-4 h-4" /> Reload
          </button>
        </div>
      </div>
    );
  }
}
