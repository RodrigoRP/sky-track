export default function Button({ children, variant = 'primary', icon, onClick, type = 'button', className = '' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all active:scale-95 select-none'

  const variants = {
    primary: 'px-6 py-3.5 text-white',
    secondary: 'px-6 py-3.5 bg-[var(--color-surface-container-high)] text-[var(--color-primary)]',
    ghost: 'px-4 py-2.5 text-[var(--color-primary)] hover:bg-[var(--color-primary-fixed)] hover:bg-opacity-30',
  }

  const primaryStyle =
    variant === 'primary'
      ? {
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)',
          boxShadow: '0 4px 16px rgba(0, 49, 120, 0.25)',
        }
      : {}

  return (
    <button
      type={type}
      onClick={onClick}
      style={primaryStyle}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {icon && (
        <span className="material-symbols-rounded text-[20px] leading-none">{icon}</span>
      )}
      {children}
    </button>
  )
}
