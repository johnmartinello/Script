import type { BoardViewport } from '@/shared/model'

export interface ScreenPoint {
  x: number
  y: number
}

export interface WorldPoint {
  x: number
  y: number
}

export function worldToScreen(
  world: WorldPoint,
  viewport: BoardViewport,
  canvasSize: { width: number; height: number }
): ScreenPoint {
  return {
    x: (world.x - viewport.cx) * viewport.zoom + canvasSize.width / 2,
    y: (world.y - viewport.cy) * viewport.zoom + canvasSize.height / 2,
  }
}

export function screenToWorld(
  screen: ScreenPoint,
  viewport: BoardViewport,
  canvasSize: { width: number; height: number }
): WorldPoint {
  return {
    x: (screen.x - canvasSize.width / 2) / viewport.zoom + viewport.cx,
    y: (screen.y - canvasSize.height / 2) / viewport.zoom + viewport.cy,
  }
}

export function clampZoom(nextZoom: number): number {
  return Math.min(2.5, Math.max(0.2, nextZoom))
}
