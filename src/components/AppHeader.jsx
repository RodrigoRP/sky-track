import { user as mockUser } from '../data/mockData'
import { useAppStore } from '../store/useAppStore'

export default function AppHeader({ title, showBack = false, onBack, action }) {
  const storeUser = useAppStore((s) => s.user)
  const user = storeUser ?? mockUser
  return (
    <header
      className="fixed top-0 left-0 w-full z-50 flex flex-col md:left-1/2 md:-translate-x-1/2 md:w-[430px] md:rounded-t-[40px]"
      style={{
        background: 'var(--color-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 1px 0 var(--color-glass-header-border)',
      }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {showBack ? (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="active:scale-95 transition-transform text-[var(--color-primary)]"
            >
              <span className="material-symbols-rounded text-[24px]">arrow_back</span>
            </button>
          ) : (
            <button
              aria-label="Menu"
              className="material-symbols-rounded text-[24px] text-[var(--color-primary)] active:scale-95 transition-transform"
            >
              menu
            </button>
          )}
          {title ? (
            <span
              className="text-lg font-bold font-['Manrope'] text-[var(--color-primary)]"
              style={{ letterSpacing: '-0.3px' }}
            >
              {title}
            </span>
          ) : (
            <span
              className="text-xl font-black font-['Manrope'] text-[var(--color-primary)]"
              style={{ letterSpacing: '-0.75px' }}
            >
              SkyTrack
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--color-primary-fixed)] active:scale-95 transition-transform cursor-pointer">
            {user.avatar
              ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center font-['Manrope'] font-bold text-base text-[var(--color-primary)]">
                  {user.name?.[0]?.toUpperCase() ?? '?'}
                </span>
            }
          </div>
        </div>
      </div>
    </header>
  )
}
