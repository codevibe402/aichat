import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.4 }
  }
} as const

const cardVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
} as const

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
      className={`rounded-2xl backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] p-4 ${className}`}
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)' }}
    >
      {children}
    </motion.div>
  )
}

const tasks = [
  { text: 'Review Q4 proposal', done: true, color: 'bg-green-500', due: 'Today' },
  { text: 'Schedule team sync', done: false, color: 'bg-purple-500', due: 'Tomorrow' },
  { text: 'Update client brief', done: false, color: 'bg-blue-500', due: 'Aug 25' },
  { text: 'Prepare slides', done: false, color: 'bg-amber-500', due: 'Aug 27' },
]

export default function Dashboard() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4 w-[320px]"
    >
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white/80 text-xs font-semibold tracking-wide">Scheduled Messages</h3>
          <span className="text-[10px] text-white/30 font-medium">View all</span>
        </div>
        <div className="space-y-3">
          {[
            { title: 'Project Update', desc: 'Tomorrow 11:00 AM', badge: 'Pending', badgeColor: 'bg-amber-500/20 text-amber-400' },
            { title: 'Client Follow-up', desc: 'Aug 25 2:30 PM', badge: 'Scheduled', badgeColor: 'bg-blue-500/20 text-blue-400' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <div>
                <div className="text-white/80 text-xs font-medium">{item.title}</div>
                <div className="text-white/30 text-[10px] mt-0.5">{item.desc}</div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${item.badgeColor}`}>{item.badge}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white/80 text-xs font-semibold tracking-wide">Task Reminders</h3>
          <motion.div
            className="flex gap-1"
            initial={{ width: 0 }}
            animate={{ width: 'auto' }}
          >
            <div className="h-1 flex-1 rounded-full bg-white/[0.06] overflow-hidden w-16">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                initial={{ width: '0%' }}
                animate={{ width: '45%' }}
                transition={{ duration: 1.5, delay: 1, ease: 'easeOut' as const }}
              />
            </div>
            <span className="text-[10px] text-white/30">45%</span>
          </motion.div>
        </div>
        <div className="space-y-1.5">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                task.done ? 'bg-primary border-primary' : 'border-white/20'
              }`}>
                {task.done && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                )}
              </div>
              <div className="flex-1">
                <span className={`text-xs ${task.done ? 'text-white/30 line-through' : 'text-white/70'}`}>{task.text}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${task.color}`} />
                <span className="text-[9px] text-white/30">{task.due}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white/80 text-xs font-semibold tracking-wide">Summarize</h3>
          <div className="flex items-center gap-1">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' as const }}
            >
              <svg className="w-3 h-3 text-purple-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </motion.div>
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-3 mb-3">
          <p className="text-white/50 text-xs leading-relaxed">
            The email discusses Q4 projections, budget allocations, and team resources. Key points include a 15% revenue increase forecast...
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-primary to-secondary"
          style={{ boxShadow: '0 4px 16px rgba(124,77,255,0.25)' }}
        >
          Summarize this Page
        </motion.button>
      </GlassCard>
    </motion.div>
  )
}
