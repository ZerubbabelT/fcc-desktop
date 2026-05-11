import { contextBridge, ipcRenderer } from 'electron'
import type { ServerStatus, LogLine } from 'shared/types'

export interface ProxyResult {
  ok: boolean
  status?: number
  body?: string
  error?: string
}

export interface AppAPI {
  server: {
    start: () => Promise<ServerStatus>
    stop: () => Promise<ServerStatus>
    restart: () => Promise<ServerStatus>
    getStatus: () => Promise<ServerStatus>
    getLogs: () => Promise<LogLine[]>
  }
  config: {
    get: () => Promise<Record<string, string>>
    save: (config: Record<string, string>) => Promise<void>
  }
  proxy: {
    request: (method: string, path: string, body?: string) => Promise<ProxyResult>
  }
  logs: {
    onLog: (callback: (line: LogLine) => void) => () => void
  }
  onStatusChange: (callback: (status: ServerStatus) => void) => () => void
  username: string | undefined
}

const API: AppAPI = {
  server: {
    start: () => ipcRenderer.invoke('server:start'),
    stop: () => ipcRenderer.invoke('server:stop'),
    restart: () => ipcRenderer.invoke('server:restart'),
    getStatus: () => ipcRenderer.invoke('server:getStatus'),
    getLogs: () => ipcRenderer.invoke('server:getLogs'),
  },
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    save: (config) => ipcRenderer.invoke('config:save', config),
  },
  proxy: {
    request: (method, path, body) => ipcRenderer.invoke('proxy:request', method, path, body),
  },
  logs: {
    onLog: (callback) => {
      const handler = (_event: Electron.IpcRendererEvent, line: LogLine) => callback(line)
      ipcRenderer.on('log:line', handler)
      return () => ipcRenderer.removeListener('log:line', handler)
    },
  },
  onStatusChange: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, status: ServerStatus) => callback(status)
    ipcRenderer.on('server:statusChange', handler)
    return () => ipcRenderer.removeListener('server:statusChange', handler)
  },
  username: process.env.USER,
}

contextBridge.exposeInMainWorld('App', API)

declare global {
  interface Window {
    App: AppAPI
  }
}
