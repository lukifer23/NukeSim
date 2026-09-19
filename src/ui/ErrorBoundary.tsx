import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  label?: string
  children: ReactNode
  /** Replaces the default sheet, e.g. to keep the HUD usable when the field fails. */
  renderFallback?: (reset: () => void) => ReactNode
  /** Called before a retry so the caller can restore state. */
  onReset?: () => void
}

type State = { error: Error | null }

/**
 * Class error boundary. The sandbox wraps the app shell and the 3D field
 * separately so a failed chunk or render cannot blank the whole page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) console.error(`[nukesim:${this.props.label ?? 'app'}]`, error, info.componentStack)
  }

  private reset = () => {
    this.props.onReset?.()
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.renderFallback) return this.props.renderFallback(this.reset)
    return <DefaultFallback label={this.props.label} onReset={this.reset} />
  }
}

function DefaultFallback({ label, onReset }: { label?: string; onReset: () => void }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-ink p-6 text-body">
      <div className="max-w-md border border-white/10 bg-card p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">Something went wrong</p>
        <h1 className="mt-2 text-xl text-paper">NukeSim hit an unexpected error.</h1>
        <p className="mt-3 text-sm leading-relaxed text-mute">
          {label === 'field'
            ? 'The 3D field failed to render. The model, panel, and comparison still work.'
            : 'The page failed to render. Reload to continue.'}
        </p>
        <div className="mt-4 flex gap-2">
          <button className="bg-signal px-3 py-2 text-sm text-ink" onClick={onReset}>
            Try again
          </button>
          <button className="border border-white/15 px-3 py-2 text-sm text-body" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    </div>
  )
}
