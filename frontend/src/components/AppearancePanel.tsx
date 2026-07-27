import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const themes = [
  { emoji: '☀️', name: 'Light', color: 'from-amber-200 to-yellow-100' },
  { emoji: '🌙', name: 'Dark', color: 'from-slate-800 to-slate-900' },
  { emoji: '💜', name: 'Purple', color: 'from-purple-600 to-purple-800' },
  { emoji: '🌊', name: 'Blue', color: 'from-blue-500 to-blue-700' },
  { emoji: '🌿', name: 'Green', color: 'from-emerald-500 to-emerald-700' },
  { emoji: '🌅', name: 'Sunset', color: 'from-orange-500 to-rose-600' },
  { emoji: '🌊', name: 'Ocean', color: 'from-cyan-500 to-teal-700' },
  { emoji: '☕', name: 'Coffee', color: 'from-amber-700 to-stone-800' },
  { emoji: '🌌', name: 'Midnight', color: 'from-indigo-900 to-slate-900' },
]

export default function AppearancePanel() {
  const [selectedTheme, setSelectedTheme] = useState(1)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-6 bottom-6 z-50 w-12 h-12 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.10] flex items-center justify-center hover:bg-white/[0.10] transition-all shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg className="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-6 bottom-24 z-50 w-[360px] max-h-[70vh] overflow-y-auto rounded-3xl backdrop-blur-2xl bg-[#0a0e1a]/90 border border-white/[0.10] p-5 shadow-2xl"
            style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white/90 text-sm font-semibold">Appearance</h2>
              <button onClick={() => setIsOpen(false)} className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="mb-5">
              <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-3">Background Theme</h3>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((theme, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setSelectedTheme(i)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative rounded-xl p-2.5 flex flex-col items-center gap-1.5 border transition-all ${
                      selectedTheme === i
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className={`w-8 h-6 rounded-lg bg-gradient-to-br ${theme.color}`} />
                    <span className="text-[9px] text-white/50">{theme.emoji} {theme.name}</span>
                    {selectedTheme === i && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-3">🎨 Custom Theme</h3>
              <div className="space-y-3">
                {[
                  { label: 'Blur', value: 60 },
                  { label: 'Background Intensity', value: 40 },
                  { label: 'Noise', value: 15 },
                  { label: 'Animation Speed', value: 70 },
                  { label: 'Background Opacity', value: 50 },
                  { label: 'Border Glow Intensity', value: 55 },
                ].map((slider, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-white/40">{slider.label}</span>
                      <span className="text-white/30">{slider.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                        initial={{ width: '0%' }}
                        animate={{ width: `${slider.value}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="12"/></svg>
              </div>
              <div className="flex-1">
                <div className="text-white/60 text-[10px] font-medium">Accent Color</div>
                <div className="flex gap-1 mt-1">
                  {['#7C4DFF', '#4F8CFF', '#00E5FF', '#22C55E', '#F59E0B', '#EF4444', '#EC4899'].map((color, i) => (
                    <button key={i} className={`w-4 h-4 rounded-full border border-white/20`} style={{ background: color }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-primary to-secondary"
                style={{ boxShadow: '0 4px 16px rgba(124,77,255,0.25)' }}
              >
                Save Theme
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-white/50 bg-white/[0.06] border border-white/[0.06] hover:bg-white/[0.10] transition-colors"
              >
                Reset
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
