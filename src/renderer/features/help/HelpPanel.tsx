export function HelpPanel() {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold">Help</h2>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            Quick reference for controls, commands, and the main workflow.
          </p>
        </header>

        <section className="border border-border rounded-lg p-4 bg-[rgb(var(--bg-muted))]">
          <h3 className="font-medium mb-3">Top Bar Commands</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="font-medium">Open</span> - Load a `.gscript` project file.
            </li>
            <li>
              <span className="font-medium">Save</span> - Save current project (auto-save path if
              already opened/saved once).
            </li>
            <li>
              <span className="font-medium">Save As</span> - Save current project to a new
              `.gscript` file.
            </li>
            <li>
              <span className="font-medium">Export PDF</span> - Open print dialog with screenplay
              formatting. Choose "Save as PDF".
            </li>
            <li>
              <span className="font-medium">Export Dialogue JSON</span> - Export all dialogue lines
              (canon and branch scenes) to a `.json` file for use in game engines or localization
              tools.
            </li>
            <li>
              <span className="font-medium">Theme</span> - Switch between `Light`, `Dark`, and
              `System`.
            </li>
          </ul>
        </section>

        <section className="border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">View Tabs</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="font-medium">Editor</span> - Write screenplay beats for the selected
              scene.
            </li>
            <li>
              <span className="font-medium">Graph</span> - Visual scene flow and connections.
            </li>
            <li>
              <span className="font-medium">Split</span> - Editor and graph side-by-side.
            </li>
            <li>
              <span className="font-medium">Boards</span> - Infinite visual reference canvases for
              scenes and characters.
            </li>
            <li>
              <span className="font-medium">Help</span> - This reference page.
            </li>
          </ul>
        </section>

        <section className="border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">Scene and Graph Workflow</h3>
          <ol className="space-y-2 text-sm list-decimal list-inside">
            <li>Create a scene from the sidebar (`+ New`) or graph (`+ New scene`).</li>
            <li>Select the scene in the sidebar to edit its title and content.</li>
            <li>In the graph, drag from one scene node to another to create a branch.</li>
            <li>
              Double-click a graph node to open that scene in the editor.
            </li>
            <li>Drag scene nodes in graph view to reposition them.</li>
          </ol>
        </section>

        <section className="border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">Keyboard Shortcuts</h3>
          <p className="text-sm text-[rgb(var(--text-muted))] mb-3">
            Use <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Ctrl</kbd> on Windows/Linux or <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Cmd</kbd> on Mac for modifier keys.
          </p>
          <h4 className="text-sm font-medium mt-3 mb-2">Global</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Ctrl+R</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Cmd+R</kbd> - Toggle Reference sidebar
            </li>
          </ul>
          <h4 className="text-sm font-medium mt-3 mb-2">Editor (cursor in a beat)</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Enter</kbd> - Insert a new beat below (type follows current beat)
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Ctrl+1</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Cmd+1</kbd> - Scene heading
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Ctrl+2</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Cmd+2</kbd> - Action
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Ctrl+3</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Cmd+3</kbd> - Character cue
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Ctrl+4</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Cmd+4</kbd> - Dialogue
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Ctrl+5</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Cmd+5</kbd> - Parenthetical
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Ctrl+6</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Cmd+6</kbd> - Transition
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Ctrl+7</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Cmd+7</kbd> - Set variable
            </li>
          </ul>
          <h4 className="text-sm font-medium mt-3 mb-2">Sidebar (editing project name)</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Enter</kbd> - Save project name
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Escape</kbd> - Cancel edit and revert
            </li>
          </ul>
        </section>

        <section className="border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">Editor Commands</h3>
          <ul className="space-y-2 text-sm">
            <li>
              Use <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Enter</kbd> to insert a new beat; use <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">Ctrl+1</kbd>–<kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] border border-border text-xs font-mono">7</kbd> to change the current beat type (see shortcuts above).
            </li>
          </ul>
        </section>

        <section className="border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">Saving and Auto-save</h3>
          <p className="text-sm">
            After opening/saving a file once, edits auto-save in the background (debounced). Use
            `Save As` to branch versions of your project.
          </p>
        </section>
      </div>
    </div>
  )
}
