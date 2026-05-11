import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'

import type { registerRoute } from 'lib/electron-router-dom'

export type BrowserWindowOrNull = Electron.BrowserWindow | null

type Route = Parameters<typeof registerRoute>[0]

export interface WindowProps extends Electron.BrowserWindowConstructorOptions {
  id: Route['id']
  query?: Route['query']
}

export interface WindowCreationByIPC {
  channel: string
  window(): BrowserWindowOrNull
  callback(window: BrowserWindow, event: IpcMainInvokeEvent): void
}

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
