import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[KDS ErrorBoundary]', error, info.componentStack)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 grid place-items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold mb-1">KDS crashed</h1>
          <p className="text-sm text-slate-400 mb-3">Please reload to resume orders.</p>
          <pre className="text-xs text-left bg-slate-950 p-3 rounded-lg my-4 overflow-auto max-h-40 border border-slate-800">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-400"
          >
            <RefreshCcw className="w-4 h-4" /> Reload
          </button>
        </div>
      </div>
    )
  }
}
