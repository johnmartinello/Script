import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { update } from './update.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC =
  VITE_DEV_SERVER_URL != null
    ? path.join(process.env.APP_ROOT, 'public')
    : RENDERER_DIST

if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Game Script Writer',
    width: 1280,
    height: 800,
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL != null) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  update(win)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length > 0) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

ipcMain.handle('project:open', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'GScript', extensions: ['gscript'] }],
  })
  if (result.canceled || result.filePaths.length === 0) {
    return { path: null, data: null }
  }
  const filePath = result.filePaths[0]
  const data = await readFile(filePath, 'utf-8')
  return { path: filePath, data }
})

ipcMain.handle('project:save', async (_event, { path: filePath, data }: { path: string | null; data: string }) => {
  let pathToWrite = filePath
  if (!pathToWrite) {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'GScript', extensions: ['gscript'] }],
    })
    if (result.canceled || !result.filePath) return { path: null }
    pathToWrite = result.filePath
  }
  await writeFile(pathToWrite, data, 'utf-8')
  return { path: pathToWrite }
})
