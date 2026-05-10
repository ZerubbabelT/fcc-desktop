import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from 'renderer/components/ui/card'
import { ScrollArea } from 'renderer/components/ui/scroll-area'
import { cn } from 'renderer/lib/utils'

const allLogs = [
  { time: '10:00:01', level: 'info', message: 'FCC proxy starting...' },
  { time: '10:00:02', level: 'info', message: 'Provider connected — NVIDIA NIM' },
  { time: '10:00:03', level: 'warn', message: 'Rate limit approaching (38/40 req/min)' },
  { time: '10:00:04', level: 'error', message: 'Connection timeout, retrying...' },
  { time: '10:00:05', level: 'info', message: 'Retry successful (attempt 2)' },
  { time: '10:00:06', level: 'info', message: 'Model mapped: sonnet → nvidia_nim/z-ai/glm4.7' },
  { time: '10:00:07', level: 'warn', message: 'High latency detected (2.4s)' },
  { time: '10:00:08', level: 'info', message: 'Request completed (1243 tokens)' },
  { time: '10:00:09', level: 'info', message: 'Stream closed gracefully' },
  { time: '10:00:10', level: 'error', message: 'API key validation failed' },
]

const levels = ['all', 'info', 'warn', 'error'] as const
type Level = typeof levels[number]

const levelColors: Record<string, string> = {
  all: '',
  info: 'text-emerald-400',
  warn: 'text-amber-400',
  error: 'text-rose-400',
}

export function LogsScreen() {
  const [filter, setFilter] = useState<Level>('all')
  const [autoScroll, setAutoScroll] = useState(true)

  const logs = filter === 'all' ? allLogs : allLogs.filter(l => l.level === filter)

  return (
    <div className="flex flex-1 flex-col p-6">
      <Card className="flex flex-1 flex-col">
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base font-semibold">Logs</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
              {levels.map((l) => (
                l === 'all' ? null : (
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
                )
              ))}
            </div>
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
        <CardContent className="flex-1 pt-0">
          <ScrollArea className="h-full w-full rounded-lg border bg-black/5 p-3 font-mono text-xs dark:bg-black/20">
            {logs.length === 0 ? (
              <p className="py-8 text-center text-neutral-500">No logs match this filter</p>
            ) : (
              logs.map((log, i) => (
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
