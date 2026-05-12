import { spawn, type ChildProcess } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync, type WriteStream } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { app } from 'electron'

const CONFIG_DIR = join(homedir(), '.config', 'free-claude-code')
const ENV_PATH = join(CONFIG_DIR, '.env')
const DEFAULT_PORT = 8082
const HEALTH_CHECK_RETRIES = 30
const HEALTH_CHECK_INTERVAL = 500

export interface ServerStatus {
  running: boolean
  pid: number | null
  port: number
  uptime: number | null
}

export interface LogLine {
  time: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  raw: string
}

export interface ServerConfig {
  [key: string]: string
}

function sanitizeConfigValue(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function getHealthCheckHost(host: string | undefined): string {
  const normalized = sanitizeConfigValue(host ?? '')
  if (!normalized || normalized === '0.0.0.0' || normalized === '::') {
    return '127.0.0.1'
  }
  return normalized
}

function findCommand(): string {
  const cmd = process.platform === 'win32' ? 'free-claude-code.exe' : 'free-claude-code'
  const commonPaths: string[] = [
    join(homedir(), '.local', 'bin', cmd),
  ]

  if (process.platform === 'win32') {
    const pythonDirs = ['Python314', 'Python313', 'Python312', 'Python311']
    for (const dir of pythonDirs) {
      commonPaths.push(
        join(homedir(), 'AppData', 'Roaming', 'Python', dir, 'Scripts', cmd),
      )
    }
  } else {
    commonPaths.push(join('/usr', 'local', 'bin', cmd))
  }

  for (const p of commonPaths) {
    if (existsSync(p)) return p
  }

  return cmd
}

function parseLogLine(raw: string): LogLine {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false })

  let level: LogLine['level'] = 'info'
  const lower = raw.toLowerCase()
  if (lower.includes('error') || lower.includes('traceback') || lower.includes('exception')) {
    level = 'error'
  } else if (lower.includes('warn')) {
    level = 'warn'
  } else if (lower.includes('debug')) {
    level = 'debug'
  }

  let message = raw.trim()
  message = message.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^ ]* +\| +/, '')
  message = message.replace(/^\d{2}:\d{2}:\d{2}[^ ]* +\| +/, '')

  return { time, level, message, raw }
}

export class ServerManager {
  private process: ChildProcess | null = null
  private startTime: number | null = null
  private logBuffer: LogLine[] = []
  private readonly maxLogs = 1000
  private logStream: WriteStream | null = null
  private statusChangeCallbacks: Array<(status: ServerStatus) => void> = []
  private logCallbacks: Array<(line: LogLine) => void> = []
  private port = DEFAULT_PORT
  private healthCheckHost = '127.0.0.1'

  private getLogStream(): WriteStream {
    if (!this.logStream) {
      const logPath = join(app.getPath('userData'), 'fcc-server.log')
      this.logStream = createWriteStream(logPath, { flags: 'a' })
    }
    return this.logStream
  }

  getStatus(): ServerStatus {
    return {
      running: this.process !== null && this.process.exitCode === null,
      pid: this.process?.pid ?? null,
      port: this.port,
      uptime: this.startTime ? Date.now() - this.startTime : null,
    }
  ❮
  }

  getLogs(): LogLine[] {
    return [...this.logBuffer]
  }

  onStatusChange(cb: (status: ServerStatus) => void): () => void {
    this.statusChangeCallbacks.push(cb)
    return () => {
      this.statusChangeCallbacks = this.statusChangeCallbacks.filter(c => c !== cb)
    }
  }

  onLog(cb: (line: LogLine) => void): () => void {
    this.logCallbacks.push(cb)
    return () => {
      this.logCallbacks = this.logCallbacks.filter(c => c !== cb)
    }
  }

  private emitStatus() {
    const status = this.getStatus()
    for (const cb of this.statusChangeCallbacks) cb(status)
  }

  private addLog(line: LogLine) {
    this.logBuffer.push(line)
    if (this.logBuffer.length > this.maxLogs) {
      this.logBuffer = this.logBuffer.slice(-this.maxLogs)
    }
    try {
      this.getLogStream().write(`${line.raw}\n`)
    } catch { }
    for (const cb of this.logCallbacks) cb(line)
  }

  async start(): Promise<void> {
    if (this.process && this.process.exitCode === null) {
      this.addLog(parseLogLine('Server already running'))
      return
    }

    const config = this.loadConfig()
    this.port = Number(config.PORT) || DEFAULT_PORT
    this.healthCheckHost = getHealthCheckHost(config.HOST)

    const cmd = findCommand()
    this.addLog(parseLogLine(`Starting server: ${cmd}`))

    this.process = spawn(cmd, [], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...config, HOST: config.HOST || '0.0.0.0', PORT: String(this.port) },
      shell: false,
    })
    this.startTime = Date.now()

    this.process.stdout?.on('data', (data: Buffer) => {
      for (const line of data.toString().split('\n').filter(Boolean)) {
        this.addLog(parseLogLine(line))
      }
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      for (const line of data.toString().split('\n').filter(Boolean)) {
        this.addLog(parseLogLine(line))
      }
    })

    this.process.on('exit', (code) => {
      this.addLog(parseLogLine(`Server exited with code ${code}`))
      this.process = null
      this.startTime = null
      this.emitStatus()
    })

    this.process.on('error', (err) => {
      this.addLog(parseLogLine(`Failed to start server: ${err.message}`))
      this.process = null
      this.startTime = null
      this.emitStatus()
    })

    await this.waitForHealth()
  }

  private async waitForHealth(): Promise<void> {
    for (let i = 0; i < HEALTH_CHECK_RETRIES; i++) {
      await new Promise(r => setTimeout(r, HEALTH_CHECK_INTERVAL))
      try {
        const res = await fetch(`http://${this.healthCheckHost}:${this.port}/health`)
        if (res.ok) {
          this.addLog(parseLogLine('Server is healthy'))
          this.emitStatus()
          return
        }
      } catch { }
    }
    this.addLog(parseLogLine('Health check did not confirm server is running'))
    this.emitStatus()
  }

  async stop(): Promise<void> {
    if (!this.process || this.process.exitCode !== null) {
      this.addLog(parseLogLine('No server running'))
      return
    }

    this.addLog(parseLogLine('Stopping server...'))

    return new Promise((resolve) => {
      const proc = this.process!
      const timeout = setTimeout(() => {
        proc.kill('SIGKILL')
      }, 5000)

      proc.on('exit', () => {
        clearTimeout(timeout)
        this.process = null
        this.startTime = null
        this.addLog(parseLogLine('Server stopped'))
        this.emitStatus()
        resolve()
      })

      proc.kill('SIGTERM')
    })
  }

  async restart(): Promise<void> {
    await this.stop()
    await this.start()
  }

  loadConfig(): ServerConfig {
    if (!existsSync(ENV_PATH)) {
      this.ensureConfigDir()
      writeFileSync(ENV_PATH, '# FCC Desktop configuration\n', 'utf-8')
      return {}
    }
    const content = readFileSync(ENV_PATH, 'utf-8')
    const config: ServerConfig = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = sanitizeConfigValue(trimmed.slice(eqIdx + 1))
      if (key) config[key] = value
    }
    if (config.RATE_LIMIT_WINDOW && !config.PROVIDER_RATE_WINDOW) {
      config.PROVIDER_RATE_WINDOW = config.RATE_LIMIT_WINDOW
      delete config.RATE_LIMIT_WINDOW
    }
    return config
  }

  saveConfig(config: ServerConfig): void {
    this.ensureConfigDir()
    const lines: string[] = ['# FCC Desktop configuration']
    for (const [key, value] of Object.entries(config)) {
      lines.push(`${key}=${sanitizeConfigValue(value)}`)
    }
    lines.push('')
    writeFileSync(ENV_PATH, lines.join('\n'), 'utf-8')
    this.addLog(parseLogLine('Configuration saved'))
  }

  private ensureConfigDir() {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true })
    }
  }

  destroy() {
    if (this.process && this.process.exitCode === null) {
      this.process.kill('SIGTERM')
    }
    if (this.logStream) {
      this.logStream.end()
    }
  }
}
