import { motion } from 'framer-motion'

function SkeletonBlock({ className, style }) {
  return (
    <motion.div
      className={`rounded-xl ${className}`}
      style={{ background: 'var(--color-surface-container)', ...style }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

export function AlertCardSkeleton() {
  return (
    <div
      className="p-5 rounded-2xl"
      style={{ background: 'var(--color-surface-container-lowest)', boxShadow: '0 12px 32px rgba(26,27,33,0.04)' }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
        <SkeletonBlock className="h-7 w-16" />
      </div>
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-9 w-24" />
        </div>
        <SkeletonBlock className="h-10 w-24" />
      </div>
    </div>
  )
}
