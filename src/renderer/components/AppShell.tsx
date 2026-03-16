import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '@/renderer/store/projectStore'
import { useTheme } from '@/renderer/hooks/useTheme'
import { SceneList } from './SceneList'
import { EditorPanel } from '@/renderer/features/editor/EditorPanel'
import { GraphPanel } from '@/renderer/features/graph/GraphPanel'
import { HelpPanel } from '@/renderer/features/help/HelpPanel'
import { BoardsPanel } from '../features/boards/BoardsPanel'
import { StatsPanel } from '../features/stats/StatsPanel'
import { openProject, saveProject } from '@/renderer/features/persistence/projectFile'
import { printScreenplay } from '@/renderer/features/export/screenplayToHtml'
import { exportDialogueJson } from '@/renderer/features/export/dialogueToJson'
import { ReferenceSidebar } from '@/renderer/features/reference/ReferenceSidebar'

export function AppShell() {
  const viewMode = useProjectStore((s) => s.viewMode)
  const referenceSidebarOpen = useProjectStore((s) => s.referenceSidebarOpen)
  const toggleReferenceSidebar = useProjectStore((s) => s.toggleReferenceSidebar)
  const { theme, setTheme } = useTheme()
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false)
  const fileMenuRef = useRef<HTMLDivElement | null>(null)

  const project = useProjectStore((s) => s.project)
  const projectFilePath = useProjectStore((s) => s.projectFilePath)
  const dirty = useProjectStore((s) => s.dirty)
  const setProject = useProjectStore((s) => s.setProject)
  const setProjectFilePath = useProjectStore((s) => s.setProjectFilePath)
  const setDirty = useProjectStore((s) => s.setDirty)
  const newProject = useProjectStore((s) => s.newProject)

  useEffect(() => {
    if (!project || !dirty || !projectFilePath) return
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase()
        if (key === 'r') {
          e.preventDefault()
          useProjectStore.getState().toggleReferenceSidebar()
          return
        }
        if (key === 'h') {
          e.preventDefault()
          useProjectStore.getState().toggleBeatTipVisible()
          return
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!fileMenuRef.current) return
      if (fileMenuRef.current.contains(event.target as Node)) return
      setIsFileMenuOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFileMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  if (!project) return null

  const handleNewProject = () => {
    if (dirty && !window.confirm('You have unsaved changes. Create new project anyway?')) return
    newProject()
  }

  const handleOpen = async () => {
    if (dirty && !window.confirm('You have unsaved changes. Open other project anyway?')) return
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

  const handleExportDialogueJson = () => {
    exportDialogueJson(project)
  }
  const isDarkTheme =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  const handleThemeToggle = () => {
    setTheme(isDarkTheme ? 'light' : 'dark')
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <header className="border-b border-border px-4 py-2 flex items-center gap-4 shrink-0 bg-[rgb(var(--bg-muted))]">
        <div className="flex items-baseline gap-2 min-w-0 flex-1">
          <h1 className="text-sm font-semibold tracking-wide uppercase text-[rgb(var(--text-muted))] truncate">
            Game Script Writer
          </h1>
          {project.name && (
            <span className="text-sm text-[rgb(var(--text-muted))] truncate">
              — {project.name}
            </span>
          )}
        </div>
        <div className="flex-1 flex justify-center">
          <ViewModeToggles />
        </div>
        <div className="flex items-center justify-end gap-2 flex-1">
          <button
            type="button"
            onClick={handleSave}
            className="app-header-button"
          >
            Save
          </button>
          <button
            type="button"
            onClick={toggleReferenceSidebar}
            title="Reference (Ctrl+R)"
            className={`app-header-button ${
              referenceSidebarOpen ? 'app-header-button-active' : ''
            }`}
          >
            Reference
          </button>
          <button
            type="button"
            onClick={handleThemeToggle}
            className="app-header-icon-button"
            aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <ThemeModeIcon dark={isDarkTheme} />
          </button>
          <div ref={fileMenuRef} className="relative">
            <button
              type="button"
              className="app-header-button"
              aria-haspopup="menu"
              aria-expanded={isFileMenuOpen}
              onClick={() => setIsFileMenuOpen((open) => !open)}
            >
              More
            </button>
            {isFileMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1 min-w-[12rem] rounded-md border border-border bg-[rgb(var(--bg-muted))] shadow-sm z-10"
              >
                <FileMenu
                  onNew={handleNewProject}
                  onOpen={handleOpen}
                  onSaveAs={handleSaveAs}
                  onExportPdf={handleExportPdf}
                  onExportDialogueJson={handleExportDialogueJson}
                  onCloseMenu={() => setIsFileMenuOpen(false)}
                />
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {viewMode !== 'help' && viewMode !== 'boards' && viewMode !== 'stats' && (
          <aside className="w-56 h-full min-h-0 border-r border-border bg-[rgb(var(--bg-muted))] flex flex-col shrink-0 overflow-hidden">
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
          {viewMode === 'boards' && <BoardsPanel />}
          {viewMode === 'stats' && <StatsPanel />}
        </section>
        {viewMode !== 'help' && viewMode !== 'boards' && viewMode !== 'stats' && referenceSidebarOpen && (
          <ReferenceSidebar />
        )}
      </main>
    </div>
  )
}

function ThemeModeIcon({ dark }: { dark: boolean }) {
  if (dark) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 14.2A8 8 0 1 1 9.8 4a7 7 0 1 0 10.2 10.2z" />
    </svg>
  )
}

function FileMenu({
  onNew,
  onOpen,
  onSaveAs,
  onExportPdf,
  onExportDialogueJson,
  onCloseMenu,
}: {
  onNew: () => void
  onOpen: () => void
  onSaveAs: () => void
  onExportPdf: () => void
  onExportDialogueJson: () => void
  onCloseMenu: () => void
}) {
  const handleClick = (action: () => void) => {
    action()
    onCloseMenu()
  }

  return (
    <div className="py-1 text-sm">
      <button
        type="button"
        onClick={() => handleClick(onNew)}
        className="app-header-menu-item"
      >
        New
      </button>
      <button
        type="button"
        onClick={() => handleClick(onOpen)}
        className="app-header-menu-item"
      >
        Open
      </button>
      <button
        type="button"
        onClick={() => handleClick(onSaveAs)}
        className="app-header-menu-item"
      >
        Save As
      </button>
      <div className="app-header-menu-separator" />
      <button
        type="button"
        onClick={() => handleClick(onExportPdf)}
        className="app-header-menu-item"
      >
        Export PDF
      </button>
      <button
        type="button"
        onClick={() => handleClick(onExportDialogueJson)}
        className="app-header-menu-item"
      >
        Export Dialogue JSON
      </button>
    </div>
  )
}

function ViewModeToggles() {
  const viewMode = useProjectStore((s) => s.viewMode)
  const setViewMode = useProjectStore((s) => s.setViewMode)
  return (
    <div className="flex rounded border border-border overflow-hidden bg-[rgb(var(--bg-muted))]">
      {(['editor', 'graph', 'split', 'boards', 'stats', 'help'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setViewMode(mode)}
          className={`px-2.5 py-1 text-sm capitalize transition-colors ${
            viewMode === mode
              ? 'bg-[rgb(var(--bg))] text-[rgb(var(--text))]'
              : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--bg))]'
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  )
}
