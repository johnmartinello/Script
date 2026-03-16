import type { Project } from '@/shared/model'

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
  return true
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
    return { path: result.path, project: raw }
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
