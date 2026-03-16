import type { BoardDocument, BoardItem, BoardTextItem, Project } from '@/shared/model'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidProject(value: unknown): value is Project {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string') return false
  if (typeof value.name !== 'string') return false
  if (!Array.isArray(value.scenes)) return false
  if (!Array.isArray(value.edges)) return false
  if (!Array.isArray(value.chapters)) return false
  if (!isRecord(value.nodePositions)) return false
  // boardsByKey is optional for backward compatibility
  if ('boardsByKey' in value && value.boardsByKey != null && !isRecord(value.boardsByKey)) return false
  return true
}

function normalizeProject(raw: Project): Project {
  const normalizeBoardItem = (item: BoardItem): BoardItem => {
    if (item.type !== 'text') return item
    const textItem = item as BoardTextItem
    return {
      ...textItem,
      textFormat: textItem.textFormat ?? 'plain',
      textAlign: textItem.textAlign ?? 'left',
      boldAll: textItem.boldAll ?? false,
    }
  }

  const normalizeBoardDocument = (board: BoardDocument): BoardDocument => {
    const normalizedItems = Object.fromEntries(
      Object.entries(board.items).map(([itemId, item]) => [itemId, normalizeBoardItem(item)])
    )
    return { ...board, items: normalizedItems }
  }

  const normalizedBoards = Object.fromEntries(
    Object.entries(raw.boardsByKey ?? {}).map(([key, board]) => [
      key,
      board ? normalizeBoardDocument(board) : board,
    ])
  )

  return {
    ...raw,
    boardsByKey: normalizedBoards,
  }
}

export async function openProject(): Promise<{ path: string; project: Project } | null> {
  const result = await window.ipcRenderer.invoke<{ path: string | null; data: string | null }>(
    'project:open'
  )
  if (!result.path || !result.data) return null
  try {
    const raw = JSON.parse(result.data) as unknown
    if (!isValidProject(raw)) {
      window.alert('Invalid project file format. This app now accepts only the current schema.')
      return null
    }
    return { path: result.path, project: normalizeProject(raw) }
  } catch {
    window.alert('Could not parse project file.')
    return null
  }
}

export async function saveProject(
  path: string | null,
  project: Project
): Promise<string | null> {
  const data = JSON.stringify(project, null, 2)
  const result = await window.ipcRenderer.invoke<{ path: string | null }>('project:save', {
    path,
    data,
  })
  return result.path
}
