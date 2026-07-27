import { motion } from 'framer-motion'

export default function GmailMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' as const }}
      className="relative w-full max-w-[520px] rounded-2xl overflow-hidden backdrop-blur-xl bg-white/[0.04] border border-white/10 shadow-2xl"
      style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}
    >
      <div className="flex h-[320px]">
        <div className="w-12 bg-white/[0.02] border-r border-white/[0.06] flex flex-col items-center gap-3 py-4">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center">
              <div className="w-3 h-3 rounded bg-white/[0.10]" />
            </div>
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
            <div className="flex-1 bg-white/[0.06] rounded-lg h-7 flex items-center px-3">
              <div className="w-3 h-3 rounded-full bg-white/10 mr-2" />
              <div className="h-2 w-24 bg-white/[0.08] rounded" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-white/[0.06]" />
              <div className="w-7 h-7 rounded-lg bg-white/[0.06]" />
            </div>
          </div>
          <div className="flex flex-1">
            <div className="w-36 border-r border-white/[0.06] p-2 space-y-1.5">
              {[0,1,2,3,4,5].map(i => (
                <div
                  key={i}
                  className={`rounded-lg p-2 ${i === 2 ? 'bg-white/[0.08] border border-primary/30' : 'bg-white/[0.03]'}`}
                >
                  <div className="h-1.5 w-16 bg-white/[0.08] rounded mb-1.5" />
                  <div className="h-1.5 w-20 bg-white/[0.05] rounded" />
                </div>
              ))}
            </div>
            <div className="flex-1 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/40 to-blue-500/40" />
                  <div>
                    <div className="h-2 w-28 bg-white/[0.08] rounded" />
                    <div className="h-1.5 w-16 bg-white/[0.05] rounded mt-1" />
                  </div>
                </div>
                <div className="h-2 w-12 bg-white/[0.06] rounded" />
              </div>
              <div className="h-2 w-3/4 bg-white/[0.06] rounded" />
              <div className="h-2 w-1/2 bg-white/[0.05] rounded" />
              <div className="h-2 w-5/6 bg-white/[0.05] rounded" />
              <div className="h-2 w-2/3 bg-white/[0.05] rounded" />
              <div className="flex gap-2 pt-2">
                <div className="h-7 px-4 rounded-lg bg-gradient-to-r from-primary/30 to-secondary/30 flex items-center">
                  <div className="h-1.5 w-10 bg-white/20 rounded" />
                </div>
                <div className="h-7 px-4 rounded-lg bg-white/[0.06] flex items-center">
                  <div className="h-1.5 w-10 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
