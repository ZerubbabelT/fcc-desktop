import { app, ipcMain } from 'electron'

import { makeAppWithSingleInstanceLock } from 'lib/electron-app/factories/app/instance'
import { makeAppSetup } from 'lib/electron-app/factories/app/setup'
import { loadReactDevtools } from 'lib/electron-app/utils'
import { ENVIRONMENT } from 'shared/constants'
import { MainWindow } from './windows/main'
import { waitFor } from 'shared/utils'
import { ServerManager } from './server'

const server = new ServerManager()

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()

  ipcMain.handle('server:start', async () => {
    await server.start()
    return server.getStatus()
  })

  ipcMain.handle('server:stop', async () => {
    await server.stop()
    return server.getStatus()
  })

  ipcMain.handle('server:restart', async () => {
    await server.restart()
    return server.getStatus()
  })

  ipcMain.handle('server:getStatus', () => {
    return server.getStatus()
  })

  ipcMain.handle('server:getLogs', () => {
    return server.getLogs()
  })

  ipcMain.handle('config:get', () => {
    return server.loadConfig()
  })

  ipcMain.handle('config:save', (_event, config: Record<string, string>) => {
    server.saveConfig(config)
  })

  ipcMain.handle('proxy:request', async (_event, method: string, path: string, body?: string) => {
    const status = server.getStatus()
    if (!status.running) return { ok: false, error: 'Server not running' }
    try {
      const url = `http://127.0.0.1:${status.port}${path}`
      const config = server.loadConfig()
      const headers: Record<string, string> = body ? { 'Content-Type': 'application/json' } : {}

      if (config.ANTHROPIC_AUTH_TOKEN) {
        headers['x-api-key'] = config.ANTHROPIC_AUTH_TOKEN
      }

      const res = await fetch(url, {
        method,
        headers,
        body,
      })
      const text = await res.text()
      return { ok: res.ok, status: res.status, body: text }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })

  const window = await makeAppSetup(MainWindow)

  server.onLog((line) => {
    if (window?.webContents && !window.webContents.isDestroyed()) {
      window.webContents.send('log:line', line)
    }
  })

  server.onStatusChange((status) => {
    if (window?.webContents && !window.webContents.isDestroyed()) {
      window.webContents.send('server:statusChange', status)
    }
  })

  if (ENVIRONMENT.IS_DEV) {
    await loadReactDevtools()

    window.webContents.once('devtools-opened', async () => {
      await waitFor(1000)
      window.webContents.reload()
    })
  }
})

app.on('before-quit', () => {
  server.destroy()
})
