import { motion } from 'framer-motion'

const features = [
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <path d="M8 10h.01M12 10h.01M16 10h.01"/>
      </svg>
    ),
    title: 'AI Reply Generation',
    desc: 'Smart contextual replies that match your communication style.',
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
    iconGradient: 'from-purple-400 to-blue-400',
    borderGradient: 'from-purple-500/30 via-purple-500/10 to-transparent',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
      </svg>
    ),
    title: 'Schedule Messages',
    desc: 'Plan your communications to send at the perfect time.',
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
    iconGradient: 'from-blue-400 to-cyan-400',
    borderGradient: 'from-blue-500/30 via-blue-500/10 to-transparent',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    title: 'Smart Reminders',
    desc: 'Never miss an important follow-up with intelligent alerts.',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    iconGradient: 'from-amber-400 to-orange-400',
    borderGradient: 'from-amber-500/30 via-amber-500/10 to-transparent',
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: 'Summarize Anything',
    desc: 'Condense lengthy threads into clear, actionable insights.',
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    iconGradient: 'from-cyan-400 to-teal-400',
    borderGradient: 'from-cyan-500/30 via-cyan-500/10 to-transparent',
  },
]

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-4 gap-4 max-w-7xl mx-auto px-6 pb-12">
      {features.map((feature, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 + i * 0.1, ease: 'easeOut' as const }}
          whileHover={{ y: -6, transition: { duration: 0.3 } }}
          className="group relative rounded-2xl overflow-hidden backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] p-5"
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${feature.borderGradient}`} style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }} />
          
          <div className="relative z-10">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.iconGradient} flex items-center justify-center mb-3 shadow-lg`}
              style={{ boxShadow: '0 4px 12px rgba(124,77,255,0.15)' }}
            >
              {feature.icon}
            </div>
            <h3 className="text-white/80 text-sm font-semibold mb-1.5">{feature.title}</h3>
            <p className="text-white/40 text-xs leading-relaxed">{feature.desc}</p>
          </div>

          <motion.div
            className="absolute -bottom-1 -right-1 w-16 h-16 rounded-full bg-gradient-to-br from-white/[0.06] to-transparent blur-sm"
            initial={{ scale: 0 }}
            whileHover={{ scale: 1.5 }}
            transition={{ duration: 0.4 }}
          />
        </motion.div>
      ))}
    </div>
  )
}
