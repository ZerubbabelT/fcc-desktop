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
