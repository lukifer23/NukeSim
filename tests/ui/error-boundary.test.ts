// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
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
})
