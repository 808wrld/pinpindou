import { Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type State = { hasError: boolean; message?: string }
type Props = { children: ReactNode }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) }
  }
  componentDidCatch(err: unknown) {
    console.error('ErrorBoundary caught:', err)
  }
  render() {
    if (!this.state.hasError) return this.props.children
    return <ErrorFallback message={this.state.message} />
  }
}

function ErrorFallback({ message }: { message?: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-xl font-bold">{t('error.boundary.title')}</h1>
      {message && <pre className="text-sm text-slate-500">{message}</pre>}
      <div className="flex gap-2">
        <button
          onClick={() => { localStorage.clear(); location.reload() }}
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white"
        >
          {t('error.boundary.action')}
        </button>
      </div>
    </div>
  )
}
