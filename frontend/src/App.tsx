import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Background from './components/Background'
import Particles from './components/Particles'
import ChromeToolbar from './components/ChromeToolbar'
import LeftSection from './components/LeftSection'
import ExtensionPopup from './components/ExtensionPopup'
import Dashboard from './components/Dashboard'
import FeatureCards from './components/FeatureCards'
import AppearancePanel from './components/AppearancePanel'

function CursorGlow() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])
  return (
    <div
      className="fixed pointer-events-none z-[100] w-[300px] h-[300px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(124,77,255,0.06) 0%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        left: pos.x,
        top: pos.y,
      }}
    />
  )
}

export default function App() {
  return (
    <div className="relative min-h-screen bg-deep-navy overflow-hidden">
      <Background />
      <Particles />
      <CursorGlow />

      <ChromeToolbar />

      <motion.div
        className="relative z-10 flex items-start justify-center gap-12 px-6 pt-10 pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start gap-12 max-w-7xl w-full justify-center">
          <div className="shrink-0 pt-8">
            <LeftSection />
          </div>

          <div className="relative shrink-0 pt-2">
            <div className="absolute -inset-20 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
            <ExtensionPopup />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="flex items-center justify-center gap-2 mt-4"
            >
              <div className="flex -space-x-1.5">
                {[1,2,3].map(i => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-deep-navy bg-gradient-to-br from-purple-500/40 to-blue-500/40" />
                ))}
              </div>
              <span className="text-white/30 text-[10px]">ReplyGenie Extension • v2.0</span>
              <div className="flex items-center gap-1 ml-2">
                <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-[8px] text-white/30 font-mono">⌘</kbd>
                <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-[8px] text-white/30 font-mono">K</kbd>
              </div>
            </motion.div>
          </div>

          <div className="shrink-0 pt-8">
            <Dashboard />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="relative z-10 mb-6"
      >
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </div>
        <FeatureCards />
      </motion.div>

      <div className="relative z-10 text-center pb-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="text-white/20 text-[11px] tracking-wider"
        >
          Made with precision · ReplyGenie AI
        </motion.p>
      </div>

      <AppearancePanel />
    </div>
  )
}
