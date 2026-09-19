// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement, type ReactElement, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ErrorBoundary } from '../../src/ui/ErrorBoundary'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function Boom(): ReactNode {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  let root: Root | null = null
  let container: HTMLDivElement | null = null

  afterEach(() => {
    if (root) act(() => root?.unmount())
    container?.remove()
    root = null
    container = null
  })

  function mount(element: ReactElement) {
    container = document.createElement('div')
    document.body.appendChild(container)
    const localRoot = createRoot(container)
    root = localRoot
    act(() => {
      localRoot.render(element)
    })
  }

  it('renders children when nothing throws', () => {
    mount(createElement(ErrorBoundary, null, createElement('span', null, 'fine')))
    expect(container?.textContent).toContain('fine')
  })

  it('renders the default fallback when a child throws', () => {
    mount(createElement(ErrorBoundary, { label: 'field' }, createElement(Boom)))
    expect(container?.textContent).toContain('Something went wrong')
    expect(container?.textContent).toContain('Try again')
  })

  it('uses a custom fallback when provided', () => {
    mount(
      createElement(
        ErrorBoundary,
        { renderFallback: () => createElement('span', null, 'custom fallback') },
        createElement(Boom),
      ),
    )
    expect(container?.textContent).toContain('custom fallback')
  })

  it('recovers and calls onReset once the child stops throwing', () => {
    let boom = true
    function Flaky() {
      if (boom) throw new Error('boom')
      return createElement('span', null, 'recovered')
    }
    const onReset = vi.fn()
    mount(createElement(ErrorBoundary, { onReset }, createElement(Flaky)))
    expect(container?.textContent).toContain('Something went wrong')

    boom = false
    const retry = container?.querySelector('button') as HTMLButtonElement
    act(() => {
      retry.click()
    })
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(container?.textContent).toContain('recovered')
  })
})
