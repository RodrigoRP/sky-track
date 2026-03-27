import { NavLink } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

const navItems = [
  { to: '/dashboard', icon: 'home_max', label: 'Home' },
  { to: '/alerts', icon: 'radar', label: 'Alerts' },
  { to: '/notifications', icon: 'notifications_active', label: 'Updates' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
]

export default function DesktopSidebar() {
  const notifications = useAppStore((s) => s.notifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <nav
      className="hidden lg:flex flex-col gap-1 fixed z-50"
      aria-label="Desktop navigation"
      style={{
        top: '50%',
        transform: 'translateY(-50%)',
        right: 'calc(50% + 215px + 20px)',
        background: 'var(--color-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '16px 12px',
        boxShadow: '0 8px 32px rgba(0, 49, 120, 0.12), 0 0 0 1px var(--color-glass-nav-border)',
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          aria-label={item.label}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
              isActive
                ? 'bg-[var(--color-primary-fixed)] text-[var(--color-primary)]'
                : 'text-[var(--color-outline)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative flex-shrink-0">
                <span
                  className="material-symbols-rounded text-[22px] leading-none"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                {item.to === '/notifications' && unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[14px] h-3.5 rounded-full text-[8px] font-black flex items-center justify-center text-white px-0.5"
                    style={{ background: 'var(--color-error)' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[13px] font-semibold font-['Inter'] whitespace-nowrap">
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
