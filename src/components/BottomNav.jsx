import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'

export default function BottomNav() {
  const { t } = useTranslation()
  const notifications = useAppStore((s) => s.notifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  const navItems = [
    { to: '/dashboard', icon: 'home_max', label: t('nav.dashboard') },
    { to: '/alerts', icon: 'radar', label: t('nav.alerts') },
    { to: '/notifications', icon: 'notifications_active', label: t('nav.notifications') },
    { to: '/settings', icon: 'settings', label: t('nav.settings') },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 rounded-t-3xl z-50 md:left-1/2 md:-translate-x-1/2 md:w-[430px] md:rounded-b-[40px] lg:hidden"
      style={{
        background: 'var(--color-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
        borderTop: '1px solid var(--color-glass-nav-border)',
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          aria-label={item.label}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-300 active:scale-90 ${
              isActive
                ? 'bg-[var(--color-primary-fixed)] text-[var(--color-primary)] mb-1'
                : 'text-[var(--color-outline)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <span
                  className="material-symbols-rounded text-[24px] mb-1 leading-none"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                {item.to === '/notifications' && unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white px-0.5"
                    style={{ background: 'var(--color-error)' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold font-['Inter'] uppercase tracking-widest">
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
