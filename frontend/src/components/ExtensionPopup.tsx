import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const tabs = ['Reply', 'Schedule', 'Remind', 'Summarize']
const tones = ['Friendly', 'Concise', 'Formal']

export default function ExtensionPopup() {
  const [activeTab, setActiveTab] = useState(0)
  const [activeTone, setActiveTone] = useState(0)
  const [replyText, setReplyText] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-[400px] rounded-3xl overflow-hidden backdrop-blur-2xl shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 30px 80px rgba(124,77,255,0.15), 0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)',
      }}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

      <div className="px-5 pt-4 pb-3 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">ReplyGenie</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.10] transition-colors">
            <svg className="w-3.5 h-3.5 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          <button className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.10] transition-colors">
            <svg className="w-3.5 h-3.5 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div className="px-5 pt-3 pb-2 border-b border-white/[0.06] flex gap-1">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className="relative px-3 py-2 text-xs font-medium transition-colors"
          >
            <span className={i === activeTab ? 'text-white' : 'text-white/40 hover:text-white/70'}>{tab}</span>
            {i === activeTab && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="px-5 py-4 space-y-4"
        >
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3.5 relative overflow-hidden"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-blue-300" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/></svg>
                </div>
                <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">Detected Email</span>
              </div>
              <span className="text-white/30 text-[10px]">1m ago</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Hi John,<br /><br />
              Thanks for reaching out about the Q4 projections. I've reviewed the initial numbers and...
              <span className="text-white/30"> Read more</span>
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 blur-sm opacity-60" />
            <div className="relative rounded-2xl bg-[#0a0e1a] border border-white/[0.08] overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-white/60 text-[10px] font-medium uppercase tracking-wider">AI Reply</span>
                <div className="flex items-center gap-1">
                  {['Copy', 'Insert', 'Improve'].map(action => (
                    <button
                      key={action}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/60 hover:text-white/80 text-[10px] font-medium transition-all"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Thank you for the update, John. I've reviewed the Q4 projections and everything looks promising. Let me share my detailed feedback..."
                className="w-full bg-transparent text-white/80 text-sm leading-relaxed px-3.5 py-3 outline-none resize-none placeholder:text-white/20 min-h-[80px]"
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {tones.map((tone, i) => (
                <button
                  key={tone}
                  onClick={() => setActiveTone(i)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    i === activeTone
                      ? 'bg-white/[0.10] text-white border border-white/20'
                      : 'bg-white/[0.04] text-white/40 hover:text-white/60 border border-transparent'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-white/40 text-[10px] font-medium hover:bg-white/[0.08] transition-colors">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V5M6 20v-4"/></svg>
              Tone
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full py-3 rounded-xl font-semibold text-sm text-white overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #7C4DFF, #4F8CFF)',
              boxShadow: '0 4px 20px rgba(124,77,255,0.3)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10">Generate More Replies</span>
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
