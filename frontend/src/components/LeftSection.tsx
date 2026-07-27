import { motion } from 'framer-motion'
import GmailMockup from './GmailMockup'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
} as const

const features = [
  { label: 'AI Powered', gradient: 'from-purple-500/20 to-purple-500/5' },
  { label: 'Secure', gradient: 'from-blue-500/20 to-blue-500/5' },
  { label: 'Privacy First', gradient: 'from-cyan-500/20 to-cyan-500/5' },
]

export default function LeftSection() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6 max-w-[460px]"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <span className="text-white/70 text-sm font-medium tracking-wide">ReplyGenie</span>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-4xl font-bold leading-[1.1] tracking-tight">
        AI Copilot for{' '}
        <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Smarter Communication
        </span>
      </motion.h1>

      <motion.p variants={itemVariants} className="text-white/50 text-base leading-relaxed max-w-sm">
        Generate replies, schedule messages, get reminders and summarize instantly—all in one place.
      </motion.p>

      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {features.map((f, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${f.gradient} border border-white/10 text-white/70 text-xs font-medium`}
          >
            <svg className="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            {f.label}
          </div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="mt-2">
        <GmailMockup />
      </motion.div>
    </motion.div>
  )
}
