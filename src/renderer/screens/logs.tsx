import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from 'renderer/components/ui/card'
import { ScrollArea } from 'renderer/components/ui/scroll-area'
import { cn } from 'renderer/lib/utils'
import type { LogLine } from 'shared/types'

const levels = ['all', 'info', 'warn', 'error'] as const
type Level = typeof levels[number]

const levelColors: Record<string, string> = {
  all: '',
  info: 'text-emerald-400',
  warn: 'text-amber-400',
  error: 'text-rose-400',
}

export function LogsScreen() {
  const [logs, setLogs] = useState<LogLine[]>([])
  const [filter, setFilter] = useState<Level>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.App.server.getLogs().then(setLogs)

    const unsubLog = window.App.logs.onLog((line) => {
      setLogs((prev) => [...prev.slice(-499), line])
    })
    const unsubStatus = window.App.onStatusChange(() => {
      window.App.server.getLogs().then(setLogs)
    })
    return () => {
      unsubLog()
      unsubStatus()
    }
  }, [])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  useEffect(() => {
    const viewport = scrollRef.current
    if (!viewport) return

    const handleScroll = () => {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
      if (distanceFromBottom > 24 && autoScroll) {
        setAutoScroll(false)
      }
    }

    viewport.addEventListener('scroll', handleScroll)
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [autoScroll])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter)

  const handleCopy = async () => {
    const text = filtered
      .map((l) => `[${l.time}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6">
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base font-semibold">Logs</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
              {levels.map((l) => (
                <button
                  key={l}
                  onClick={() => setFilter(l)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-all",
                    filter === l
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                      : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              onClick={handleCopy}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                copied
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              )}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                autoScroll
                  ? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  : "text-neutral-400 dark:text-neutral-500"
              )}
            >
              Auto-scroll
            </button>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 pt-0">
          <ScrollArea className="h-full min-h-0 w-full rounded-lg border bg-black/5 p-3 font-mono text-xs dark:bg-black/20" viewportRef={scrollRef}>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-neutral-500">No logs match this filter</p>
            ) : (
              filtered.map((log, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-3 py-1.5 transition-colors hover:bg-white/5"
                >
                  <span className="w-16 shrink-0 text-neutral-500">{log.time}</span>
                  <span className={cn("w-12 shrink-0 font-semibold", levelColors[log.level])}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="text-neutral-700 dark:text-neutral-300">{log.message}</span>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
