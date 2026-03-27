import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
    // To enable Sentry: npm install @sentry/react
    // Sentry.captureException(error, { extra: info })
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center p-8 text-center"
          style={{ background: 'var(--color-surface)' }}
        >
          <span className="material-symbols-rounded text-[64px] mb-4" style={{ color: 'var(--color-error)' }}>
            error
          </span>
          <h1
            className="font-['Manrope'] font-bold text-2xl mb-2"
            style={{ color: 'var(--color-on-surface)', letterSpacing: '-0.3px' }}
          >
            Something went wrong
          </h1>
          <p className="font-['Inter'] text-sm mb-8 max-w-xs leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>
            An unexpected error occurred. Your alerts and data are safe — try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 rounded-2xl font-['Manrope'] font-bold text-white"
            style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-container))' }}
          >
            Refresh Page
          </button>
          {import.meta.env.DEV && (
            <details className="mt-6 text-left max-w-xs">
              <summary className="text-xs cursor-pointer font-['Inter']" style={{ color: 'var(--color-outline)' }}>
                Error details (dev only)
              </summary>
              <pre className="text-[10px] mt-2 overflow-auto whitespace-pre-wrap" style={{ color: 'var(--color-error)' }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
