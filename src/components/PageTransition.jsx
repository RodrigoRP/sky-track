import { motion } from 'framer-motion'

export default function PageTransition({ children, direction = 1 }) {
  return (
    <motion.div
      key={direction}
      initial={{ opacity: 0, x: direction * 36 }}
      animate={{
        opacity: 1,
        x: 0,
        transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] },
      }}
      style={{ minHeight: '100dvh' }}
    >
      {children}
    </motion.div>
  )
}
