import { useState, useEffect } from "react"
import { Power, Activity, FlaskConical } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "renderer/lib/utils"

function parseMessageStream(body: string): string {
  let model = ''
  let text = ''

  for (const line of body.split('\n')) {
    if (!line.startsWith('data: ')) continue
    const data = line.slice(6).trim()
    if (!data || data === '[DONE]') continue

    try {
      const event = JSON.parse(data)
      if (event.type === 'message_start' && event.message?.model) {
        model = event.message.model
      }
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        text += event.delta.text ?? ''
      }
      if (event.type === 'content_block_start' && event.content_block?.type === 'text') {
        text += event.content_block.text ?? ''
      }
    } catch {}
  }

  const output = text.trim()
  if (output && model) return `${output}\n\nModel: ${model}`
  if (output) return output
  if (model) return `Request succeeded\n\nModel: ${model}`
  return body
}

export function MainScreen() {
  const [isOn, setIsOn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    window.App.server.getStatus().then((status) => {
      setIsOn(status.running)
    })
  }, [])

  const toggle = async () => {
    setLoading(true)
    setTestResult(null)
    setTestError(null)
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

  const testModels = async () => {
    setTesting(true)
    setTestResult(null)
    setTestError(null)
    try {
      const res = await window.App.proxy.request('GET', '/v1/models?limit=1000')
      if (res.ok) {
        setTestResult(res.body ?? '')
      } else {
        setTestError(res.error ?? `HTTP ${res.status}: ${res.body}`)
      }
    } catch (err) {
      setTestError(String(err))
    } finally {
      setTesting(false)
    }
  }

  const testMessages = async () => {
    setTesting(true)
    setTestResult(null)
    setTestError(null)
    try {
      const body = JSON.stringify({
        model: 'claude-3-5-sonnet',
        max_tokens: 24,
        stream: true,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Reply with exactly OK.',
              },
            ],
          },
        ],
      })
      const res = await window.App.proxy.request('POST', '/v1/messages?beta=true', body)
      if (res.ok) {
        setTestResult(parseMessageStream(res.body ?? ''))
      } else {
        setTestError(res.error ?? `HTTP ${res.status}: ${res.body}`)
      }
    } catch (err) {
      setTestError(String(err))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
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

      {isOn && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={testModels}
              disabled={testing}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 bg-white/50 px-3 py-2 text-xs font-medium text-neutral-600 transition-all hover:border-neutral-300 hover:bg-white disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:border-neutral-600"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              {testing ? 'Testing...' : 'GET /v1/models'}
            </button>
            <button
              onClick={testMessages}
              disabled={testing}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 bg-white/50 px-3 py-2 text-xs font-medium text-neutral-600 transition-all hover:border-neutral-300 hover:bg-white disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300 dark:hover:border-neutral-600"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              {testing ? 'Testing...' : 'POST /v1/messages'}
            </button>
          </div>

          {(testResult || testError) && (
            <div className={cn(
              "w-full max-w-md rounded-lg border p-3 font-mono text-xs",
              testError
                ? "border-rose-500/30 bg-rose-500/5 text-rose-400"
                : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
            )}>
              <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap break-all">
                {testError ?? testResult}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
