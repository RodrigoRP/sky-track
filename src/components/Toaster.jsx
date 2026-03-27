import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useToastList, useToastDismiss } from '../hooks/useToast'

const ICONS = {
  success: 'check_circle',
  error: 'cancel',
  warning: 'warning',
  default: 'info',
}

const COLORS = {
  success: { bg: 'var(--color-secondary)', text: 'white' },
  error: { bg: 'var(--color-error)', text: 'white' },
  warning: { bg: 'var(--color-tertiary)', text: 'white' },
  default: { bg: 'var(--color-inverse-surface)', text: 'var(--color-inverse-on-surface)' },
}

export default function Toaster() {
  const toasts = useToastList()
  const dismiss = useToastDismiss()

  return (
    <div className="fixed top-20 left-0 w-full z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => {
        const color = COLORS[toast.type] ?? COLORS.default
        const icon = ICONS[toast.type] ?? ICONS.default
        return (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            onClick={() => dismiss(toast.id)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl pointer-events-auto cursor-pointer max-w-sm w-full"
            style={{ background: color.bg }}
          >
            <span
              className="material-symbols-rounded text-[20px] shrink-0"
              style={{ color: color.text, fontVariationSettings: "'FILL' 1" }}
            >
              {icon}
            </span>
            <span
              className="font-['Inter'] font-semibold text-sm flex-1"
              style={{ color: color.text }}
            >
              {toast.message}
            </span>
            {toast.url && (
              <Link
                to={toast.url}
                onClick={() => dismiss(toast.id)}
                className="text-[11px] font-black uppercase tracking-wider shrink-0 opacity-80 hover:opacity-100"
                style={{ color: color.text }}
              >
                View →
              </Link>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
