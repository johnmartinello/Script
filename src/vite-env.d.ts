/// <reference types="vite/client" />

interface Window {
  ipcRenderer: {
    on(channel: string, listener: (...args: unknown[]) => void): void
    off(channel: string, listener: (...args: unknown[]) => void): void
    send(channel: string, ...args: unknown[]): void
    invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>
  }
}
