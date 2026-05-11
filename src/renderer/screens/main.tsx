import { useState, useEffect } from "react"
import { Power, Activity } from "lucide-react"
import { motion } from "motion/react"

export function MainScreen() {
  const [isOn, setIsOn] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.App.server.getStatus().then((status) => {
      setIsOn(status.running)
    })
  }, [])

  const toggle = async () => {
    setLoading(true)
    try {
      if (isOn) {
        const status = await window.App.server.stop()
        setIsOn(status.running)
      } else {
        const status = await window.App.server.start()
        setIsOn(status.running)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <motion.button
          onClick={toggle}
          disabled={loading}
          whileTap={loading ? {} : { scale: 0.92 }}
          whileHover={loading ? {} : { scale: 1.05 }}
          className={`
            relative flex h-40 w-40 cursor-pointer items-center justify-center
            rounded-full border-2 transition-all duration-500 outline-none
            disabled:cursor-not-allowed disabled:opacity-60
            ${isOn
              ? 'border-emerald-500/40 bg-emerald-500 shadow-[0_0_60px_rgba(52,211,153,0.3)]'
              : 'border-rose-500/30 bg-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.15)]'
            }
          `}
        >
          {isOn && (
            <>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 rounded-full bg-emerald-500"
              />
              <motion.span
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-emerald-400"
              />
              <motion.span
                initial={{ scale: 0, opacity: 0.3 }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="absolute inset-0 rounded-full bg-emerald-300"
              />
            </>
          )}
          <motion.div
            animate={{ rotate: isOn ? 0 : 180 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="relative z-10"
          >
            {isOn ? (
              <Activity className="h-16 w-16 text-white" />
            ) : (
              <Power className="h-16 w-16 text-rose-400/70" />
            )}
          </motion.div>
        </motion.button>

        <div className="flex flex-col items-center gap-1.5">
          <motion.span
            key={isOn ? 'on' : 'off'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-2xl font-bold tracking-tight ${isOn ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {loading ? '...' : isOn ? 'Running' : 'Stopped'}
          </motion.span>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
            Port 8082
          </span>
        </div>
      </div>
    </div>
  )
}
