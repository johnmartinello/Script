import type { Project } from '@/shared/model'

export async function openProject(): Promise<{ path: string; project: Project } | null> {
  const result = await window.ipcRenderer.invoke<{ path: string | null; data: string | null }>(
    'project:open'
  )
  if (!result.path || !result.data) return null
  const project = JSON.parse(result.data) as Project
  return { path: result.path, project }
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
