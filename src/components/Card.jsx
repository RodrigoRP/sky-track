export default function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ boxShadow: '0 2px 12px rgba(26, 27, 33, 0.06)' }}
      className={`bg-[var(--color-surface-container-lowest)] rounded-2xl overflow-hidden ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
