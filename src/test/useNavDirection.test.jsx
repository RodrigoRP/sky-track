import { describe, it, expect } from 'vitest'
import { renderHook, render, screen, act } from '@testing-library/react'
import { MemoryRouter, createMemoryRouter, RouterProvider } from 'react-router-dom'
import { useNavDirection } from '../hooks/useNavDirection'

// ── Helpers ───────────────────────────────────────────────────────────────────

function wrapper(initialPath) {
  return ({ children }) => (
    <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
  )
}

/**
 * Renders useNavDirection inside a createMemoryRouter so we can
 * navigate programmatically and observe direction changes.
 * Direction is exposed via a data attribute to keep the component pure.
 */
function renderWithRouter(initialPath) {
  function Probe() {
    const dir = useNavDirection()
    return <div data-testid="probe" data-direction={dir} />
  }

  const router = createMemoryRouter(
    [{ path: '*', element: <Probe /> }],
    { initialEntries: [initialPath] }
  )

  render(<RouterProvider router={router} />)

  return {
    router,
    getDirection: () => Number(screen.getByTestId('probe').dataset.direction),
  }
}

// ── Initial state ─────────────────────────────────────────────────────────────

describe('useNavDirection — initial state', () => {
  it('returns 0 on first render (no navigation yet)', () => {
    const { result } = renderHook(() => useNavDirection(), {
      wrapper: wrapper('/dashboard'),
    })
    expect(result.current).toBe(0)
  })

  it('returns 0 on deep link (no prior navigation from the session)', () => {
    const { getDirection } = renderWithRouter('/alert/42')
    expect(getDirection()).toBe(0)
  })
})

// ── Forward navigation ────────────────────────────────────────────────────────

describe('useNavDirection — forward navigation', () => {
  it('returns 1 when going from depth-0 to depth-2 (dashboard → alert detail)', async () => {
    const { router, getDirection } = renderWithRouter('/dashboard')
    expect(getDirection()).toBe(0)

    await act(async () => {
      await router.navigate('/alert/1')
    })

    expect(getDirection()).toBe(1)
  })

  it('returns 1 when going from depth-0 to depth-1 (dashboard → create-alert)', async () => {
    const { router, getDirection } = renderWithRouter('/dashboard')

    await act(async () => {
      await router.navigate('/create-alert')
    })

    expect(getDirection()).toBe(1)
  })
})

// ── Back navigation ───────────────────────────────────────────────────────────

describe('useNavDirection — back navigation', () => {
  it('returns -1 when going from depth-2 to depth-0 (alert detail → dashboard)', async () => {
    const { router, getDirection } = renderWithRouter('/alert/1')
    expect(getDirection()).toBe(0)

    await act(async () => {
      await router.navigate('/dashboard')
    })

    expect(getDirection()).toBe(-1)
  })

  it('returns -1 when going from depth-1 to depth-0 (create-alert → notifications)', async () => {
    const { router, getDirection } = renderWithRouter('/create-alert')

    await act(async () => {
      await router.navigate('/notifications')
    })

    expect(getDirection()).toBe(-1)
  })
})

// ── Same-depth navigation ─────────────────────────────────────────────────────

describe('useNavDirection — same-depth navigation', () => {
  it('returns 0 when navigating between two depth-0 routes (dashboard → notifications)', async () => {
    const { router, getDirection } = renderWithRouter('/dashboard')

    await act(async () => {
      await router.navigate('/notifications')
    })

    expect(getDirection()).toBe(0)
  })

  it('returns 0 when navigating between two depth-0 routes (settings → notifications)', async () => {
    const { router, getDirection } = renderWithRouter('/settings')

    await act(async () => {
      await router.navigate('/notifications')
    })

    expect(getDirection()).toBe(0)
  })
})
