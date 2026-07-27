import { motion } from 'framer-motion'

const blobs = [
  { size: 600, x: '10%', y: '20%', color: 'rgba(124, 77, 255, 0.12)', duration: 20, delay: 0 },
  { size: 500, x: '70%', y: '10%', color: 'rgba(79, 140, 255, 0.10)', duration: 25, delay: 2 },
  { size: 450, x: '50%', y: '60%', color: 'rgba(0, 229, 255, 0.08)', duration: 18, delay: 1 },
  { size: 350, x: '85%', y: '70%', color: 'rgba(124, 77, 255, 0.10)', duration: 22, delay: 3 },
  { size: 400, x: '20%', y: '80%', color: 'rgba(79, 140, 255, 0.08)', duration: 16, delay: 0.5 },
]

export default function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#070B1F] via-[#0a0f2e] to-[#070B1F]" />
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(ellipse at 20% 50%, rgba(124,77,255,0.15) 0%, transparent 60%)',
            'radial-gradient(ellipse at 80% 20%, rgba(79,140,255,0.12) 0%, transparent 60%)',
            'radial-gradient(ellipse at 40% 80%, rgba(0,229,255,0.10) 0%, transparent 60%)',
            'radial-gradient(ellipse at 60% 40%, rgba(124,77,255,0.12) 0%, transparent 60%)',
            'radial-gradient(ellipse at 20% 50%, rgba(124,77,255,0.15) 0%, transparent 60%)',
          ],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' as const }}
      />
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: blob.size,
            height: blob.size,
            background: blob.color,
          }}
          initial={{ x: blob.x, y: blob.y, scale: 1 }}
          animate={{
            x: [blob.x, `calc(${blob.x} + 8%)`, `calc(${blob.x} - 5%)`, blob.x],
            y: [blob.y, `calc(${blob.y} - 10%)`, `calc(${blob.y} + 8%)`, blob.y],
            scale: [1, 1.2, 0.9, 1],
            opacity: [0.4, 0.7, 0.5, 0.4],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            delay: blob.delay,
            ease: 'easeInOut' as const,
          }}
        />
      ))}
    </div>
  )
}
