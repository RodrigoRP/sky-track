const variants = {
  price_drop: {
    bg: 'bg-[var(--color-secondary-container)]',
    text: 'text-[var(--color-on-secondary-container)]',
    icon: 'trending_down',
  },
  target_reached: {
    bg: 'bg-[var(--color-primary-fixed)]',
    text: 'text-[var(--color-on-primary-fixed)]',
    icon: 'stars',
  },
  urgency: {
    bg: 'bg-[var(--color-tertiary-container)]',
    text: 'text-[var(--color-on-tertiary-container)]',
    icon: 'bolt',
  },
  new_low: {
    bg: 'bg-[var(--color-secondary-container)]',
    text: 'text-[var(--color-on-secondary-container)]',
    icon: 'arrow_downward',
  },
  discount: {
    bg: 'bg-[var(--color-secondary-container)]',
    text: 'text-[var(--color-on-secondary-container)]',
    icon: null,
  },
}

export default function Badge({ variant = 'price_drop', label, showIcon = true }) {
  const style = variants[variant] ?? variants.price_drop

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold font-['Inter'] ${style.bg} ${style.text}`}
    >
      {showIcon && style.icon && (
        <span className="material-symbols-rounded text-[14px] leading-none">{style.icon}</span>
      )}
      {label}
    </span>
  )
}
