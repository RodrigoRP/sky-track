import { useState } from 'react'
import { useLocation } from 'react-router-dom'

// Route depths — deeper = forward (1), shallower = back (-1)
const DEPTH = {
  '/dashboard': 0,
  '/notifications': 0,
  '/settings': 0,
  '/alerts': 1,
  '/create-alert': 1,
  '/alert': 2,
}

function getDepth(pathname) {
  for (const [prefix, depth] of Object.entries(DEPTH)) {
    if (pathname.startsWith(prefix)) return depth
  }
  return 0
}

export function useNavDirection() {
  const location = useLocation()
  const currentDepth = getDepth(location.pathname)

  const [nav, setNav] = useState({ prevDepth: currentDepth, direction: 0 })

  // Calling setState during render with a guard is the React-approved way to
  // derive state from props/context without triggering infinite loops.
  if (nav.prevDepth !== currentDepth) {
    const newDir = currentDepth > nav.prevDepth ? 1 : -1
    setNav({ prevDepth: currentDepth, direction: newDir })
    return newDir
  }

  return nav.direction
}
