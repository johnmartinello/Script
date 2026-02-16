import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/renderer/store/projectStore'
import { useTheme } from '@/renderer/hooks/useTheme'
import { SceneList } from './SceneList'
import { EditorPanel } from '@/renderer/features/editor/EditorPanel'
import { GraphPanel } from '@/renderer/features/graph/GraphPanel'
import { HelpPanel } from '@/renderer/features/help/HelpPanel'
import { openProject, saveProject } from '@/renderer/features/persistence/projectFile'
import { printScreenplay } from '@/renderer/features/export/screenplayToHtml'

export function AppShell() {
  const viewMode = useProjectStore((s) => s.viewMode)
  const { theme, setTheme } = useTheme()
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const project = useProjectStore((s) => s.project)
  const projectFilePath = useProjectStore((s) => s.projectFilePath)
  const dirty = useProjectStore((s) => s.dirty)
  const setProject = useProjectStore((s) => s.setProject)
  const setProjectFilePath = useProjectStore((s) => s.setProjectFilePath)
  const setDirty = useProjectStore((s) => s.setDirty)

  useEffect(() => {
    if (!dirty || !projectFilePath) return
    if (autosaveRef.current) clearTimeout(autosaveRef.current)
    autosaveRef.current = setTimeout(() => {
      saveProject(projectFilePath, project).then((path) => {
        if (path) setDirty(false)
      })
      autosaveRef.current = null
    }, 2000)
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current)
    }
  }, [dirty, projectFilePath, project, setDirty])

  const handleOpen = async () => {
    const result = await openProject()
    if (result) {
      setProject(result.project)
      setProjectFilePath(result.path)
    }
  }

  const handleSave = async () => {
    const path = await saveProject(projectFilePath, project)
    if (path) {
      setProjectFilePath(path)
      setDirty(false)
    }
  }

  const handleSaveAs = async () => {
    const path = await saveProject(null, project)
    if (path) {
      setProjectFilePath(path)
      setDirty(false)
    }
  }

  const handleExportPdf = () => {
    printScreenplay(project)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <header className="border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-medium">Game Script Writer</h1>
        <div className="flex items-center gap-2">
          <FileMenu
            onOpen={handleOpen}
            onSave={handleSave}
            onSaveAs={handleSaveAs}
            onExportPdf={handleExportPdf}
          />
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
            className="text-sm bg-[rgb(var(--bg-muted))] border border-border rounded px-2 py-1"
            aria-label="Theme"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          <ViewModeToggles />
        </div>
      </header>
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {viewMode !== 'help' && (
          <aside className="w-56 border-r border-border bg-[rgb(var(--bg-muted))] flex flex-col shrink-0">
            <SceneList />
          </aside>
        )}
        <section className="flex-1 flex min-w-0 overflow-hidden">
          {viewMode === 'editor' && <EditorPanel />}
          {viewMode === 'graph' && <GraphPanel />}
          {viewMode === 'split' && (
            <>
              <div className="flex-1 min-w-0 overflow-hidden border-r border-border">
                <EditorPanel />
              </div>
              <div className="w-1/2 min-w-0 overflow-hidden">
                <GraphPanel />
              </div>
            </>
          )}
          {viewMode === 'help' && <HelpPanel />}
        </section>
      </main>
    </div>
  )
}

function FileMenu({
  onOpen,
  onSave,
  onSaveAs,
  onExportPdf,
}: {
  onOpen: () => void
  onSave: () => void
  onSaveAs: () => void
  onExportPdf: () => void
}) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={onOpen}
        className="px-2 py-1 text-sm rounded border border-border bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--border))]"
      >
        Open
      </button>
      <button
        type="button"
        onClick={onSave}
        className="px-2 py-1 text-sm rounded border border-border bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--border))]"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onSaveAs}
        className="px-2 py-1 text-sm rounded border border-border bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--border))]"
      >
        Save As
      </button>
      <button
        type="button"
        onClick={onExportPdf}
        className="px-2 py-1 text-sm rounded border border-border bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--border))]"
      >
        Export PDF
      </button>
    </div>
  )
}

function ViewModeToggles() {
  const viewMode = useProjectStore((s) => s.viewMode)
  const setViewMode = useProjectStore((s) => s.setViewMode)
  return (
    <div className="flex rounded border border-border overflow-hidden">
      {(['editor', 'graph', 'split', 'help'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setViewMode(mode)}
          className={`px-3 py-1 text-sm capitalize ${
            viewMode === mode
              ? 'bg-[rgb(var(--accent))] text-white'
              : 'bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--border))]'
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  )
}
